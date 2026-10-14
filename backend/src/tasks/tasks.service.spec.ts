import { NotFoundException } from '@nestjs/common';
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

  beforeEach(() => {
    database = createTestDatabase();
    process.env.DATABASE_URL = database.url;
    prisma = new PrismaService();
    service = new TasksService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
    delete process.env.DATABASE_URL;
    database.remove();
  });

  it('starts with no tasks', async () => {
    expect(await service.findAll()).toEqual([]);
  });

  it('creates a task', async () => {
    const task = await service.create({ title: 'Buy milk' });

    expect(task).toMatchObject({
      title: 'Buy milk',
      completed: false,
      dueDate: null,
    });
    expect(task.id).toBeDefined();
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(await service.findAll()).toHaveLength(1);
  });

  it('lists tasks by due date with undated tasks last', async () => {
    await service.create({ title: 'No date' });
    await service.create({ title: 'Later', dueDate: '2026-12-01' });
    await service.create({ title: 'Sooner', dueDate: '2026-11-01' });

    const titles = (await service.findAll()).map((task) => task.title);

    expect(titles).toEqual(['Sooner', 'Later', 'No date']);
  });

  it('finds a task by id', async () => {
    const created = await service.create({ title: 'Buy milk' });

    expect(await service.findOne(created.id)).toMatchObject({
      title: 'Buy milk',
    });
  });

  it('throws NotFoundException when finding a missing task', async () => {
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('updates a task title and completed state', async () => {
    const created = await service.create({ title: 'Buy milk' });

    const updated = await service.update(created.id, {
      title: 'Buy bread',
      completed: true,
    });

    expect(updated).toMatchObject({ title: 'Buy bread', completed: true });
  });

  it('keeps existing fields when updating partially', async () => {
    const created = await service.create({
      title: 'Buy milk',
      dueDate: '2026-11-01',
    });

    const updated = await service.update(created.id, { completed: true });

    expect(updated).toMatchObject({
      title: 'Buy milk',
      completed: true,
      dueDate: new Date('2026-11-01'),
    });
  });

  it('clears the due date when it is set to null', async () => {
    const created = await service.create({
      title: 'Buy milk',
      dueDate: '2026-11-01',
    });

    const updated = await service.update(created.id, { dueDate: null });

    expect(updated.dueDate).toBeNull();
  });

  it('throws NotFoundException when updating a missing task', async () => {
    await expect(service.update(999, { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('removes a task', async () => {
    const created = await service.create({ title: 'Buy milk' });

    await service.remove(created.id);

    expect(await service.findAll()).toEqual([]);
  });

  it('throws NotFoundException when removing a missing task', async () => {
    await expect(service.remove(999)).rejects.toThrow(NotFoundException);
  });
});
