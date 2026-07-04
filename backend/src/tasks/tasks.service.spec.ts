process.env.DB_PATH = ':memory:';

import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(() => {
    service = new TasksService();
  });

  it('starts with no tasks', () => {
    expect(service.findAll()).toEqual([]);
  });

  it('creates a task', () => {
    const task = service.create({ title: 'Buy milk' });

    expect(task).toMatchObject({ title: 'Buy milk', completed: false });
    expect(task.id).toBeDefined();
    expect(service.findAll()).toHaveLength(1);
  });

  it('finds a task by id', () => {
    const created = service.create({ title: 'Buy milk' });

    expect(service.findOne(created.id)).toMatchObject({ title: 'Buy milk' });
  });

  it('throws NotFoundException when finding a missing task', () => {
    expect(() => service.findOne(999)).toThrow(NotFoundException);
  });

  it('updates a task title and completed state', () => {
    const created = service.create({ title: 'Buy milk' });

    const updated = service.update(created.id, {
      title: 'Buy bread',
      completed: true,
    });

    expect(updated).toMatchObject({ title: 'Buy bread', completed: true });
  });

  it('keeps existing fields when updating partially', () => {
    const created = service.create({ title: 'Buy milk' });

    const updated = service.update(created.id, { completed: true });

    expect(updated).toMatchObject({ title: 'Buy milk', completed: true });
  });

  it('throws NotFoundException when updating a missing task', () => {
    expect(() => service.update(999, { title: 'x' })).toThrow(
      NotFoundException,
    );
  });

  it('removes a task', () => {
    const created = service.create({ title: 'Buy milk' });

    service.remove(created.id);

    expect(service.findAll()).toEqual([]);
  });

  it('throws NotFoundException when removing a missing task', () => {
    expect(() => service.remove(999)).toThrow(NotFoundException);
  });
});
