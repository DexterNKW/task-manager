import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import {
  createTestDatabase,
  TestDatabase,
} from '../../test/support/test-database';

describe('TasksService', () => {
  let database: TestDatabase;
  let prisma: PrismaService;
  let service: TasksService;
  let alice: number;
  let bob: number;

  beforeEach(async () => {
    database = createTestDatabase();
    prisma = new PrismaService(
      new ConfigService({ DATABASE_URL: database.url }),
    );
    service = new TasksService(prisma);
    alice = (
      await prisma.user.create({
        data: { email: 'alice@example.com', passwordHash: 'x' },
      })
    ).id;
    bob = (
      await prisma.user.create({
        data: { email: 'bob@example.com', passwordHash: 'x' },
      })
    ).id;
  });

  afterEach(async () => {
    await prisma.$disconnect();
    database.remove();
  });

  it('starts with no tasks', async () => {
    expect(await service.findAll(alice)).toEqual([]);
  });

  it('creates a task', async () => {
    const task = await service.create(alice, { title: 'Buy milk' });

    expect(task).toMatchObject({
      title: 'Buy milk',
      completed: false,
      dueDate: null,
    });
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task).not.toHaveProperty('userId');
    expect(await service.findAll(alice)).toHaveLength(1);
  });

  it('lists tasks by due date with undated tasks last', async () => {
    await service.create(alice, { title: 'No date' });
    await service.create(alice, { title: 'Later', dueDate: '2026-12-01' });
    await service.create(alice, { title: 'Sooner', dueDate: '2026-11-01' });

    const titles = (await service.findAll(alice)).map((task) => task.title);

    expect(titles).toEqual(['Sooner', 'Later', 'No date']);
  });

  it('finds a task by id', async () => {
    const created = await service.create(alice, { title: 'Buy milk' });

    expect(await service.findOne(alice, created.id)).toMatchObject({
      title: 'Buy milk',
    });
  });

  it('throws NotFoundException when finding a missing task', async () => {
    await expect(service.findOne(alice, 999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates a task title and completed state', async () => {
    const created = await service.create(alice, { title: 'Buy milk' });

    const updated = await service.update(alice, created.id, {
      title: 'Buy bread',
      completed: true,
    });

    expect(updated).toMatchObject({ title: 'Buy bread', completed: true });
  });

  it('keeps existing fields when updating partially', async () => {
    const created = await service.create(alice, {
      title: 'Buy milk',
      dueDate: '2026-11-01',
    });

    const updated = await service.update(alice, created.id, {
      completed: true,
    });

    expect(updated).toMatchObject({
      title: 'Buy milk',
      completed: true,
      dueDate: new Date('2026-11-01'),
    });
  });

  it('clears the due date when it is set to null', async () => {
    const created = await service.create(alice, {
      title: 'Buy milk',
      dueDate: '2026-11-01',
    });

    const updated = await service.update(alice, created.id, { dueDate: null });

    expect(updated.dueDate).toBeNull();
  });

  it('throws NotFoundException when updating a missing task', async () => {
    await expect(service.update(alice, 999, { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removes a task', async () => {
    const created = await service.create(alice, { title: 'Buy milk' });

    await service.remove(alice, created.id);

    expect(await service.findAll(alice)).toEqual([]);
  });

  it('throws NotFoundException when removing a missing task', async () => {
    await expect(service.remove(alice, 999)).rejects.toThrow(NotFoundException);
  });

  describe('ownership', () => {
    let aliceTask: number;

    beforeEach(async () => {
      aliceTask = (await service.create(alice, { title: 'Private' })).id;
    });

    it('lists only the tasks of the requesting user', async () => {
      await service.create(bob, { title: 'Bob task' });

      expect((await service.findAll(bob)).map((task) => task.title)).toEqual([
        'Bob task',
      ]);
    });

    it('hides tasks of other users as not found', async () => {
      await expect(service.findOne(bob, aliceTask)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not let other users update a task', async () => {
      await expect(
        service.update(bob, aliceTask, { title: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);
      expect(await service.findOne(alice, aliceTask)).toMatchObject({
        title: 'Private',
      });
    });

    it('does not let other users delete a task', async () => {
      await expect(service.remove(bob, aliceTask)).rejects.toThrow(
        NotFoundException,
      );
      expect(await service.findAll(alice)).toHaveLength(1);
    });
  });
});
