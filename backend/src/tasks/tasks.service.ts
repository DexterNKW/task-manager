import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Every query is filtered by owner: a task of another user is reported as not
// found, so its existence is never revealed.
const taskFields = {
  id: true,
  title: true,
  completed: true,
  createdAt: true,
  dueDate: true,
} as const;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
      select: taskFields,
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    });
  }

  async findOne(userId: number, id: number): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
      select: taskFields,
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(userId: number, dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        userId,
      },
      select: taskFields,
    });
  }

  async update(userId: number, id: number, dto: UpdateTaskDto): Promise<Task> {
    // undefined leaves the due date unchanged, null clears it.
    const dueDate =
      dto.dueDate === undefined
        ? undefined
        : dto.dueDate === null
          ? null
          : new Date(dto.dueDate);
    try {
      return await this.prisma.task.update({
        where: { id, userId },
        data: { title: dto.title, completed: dto.completed, dueDate },
        select: taskFields,
      });
    } catch (error) {
      throw this.notFoundOr(error, id);
    }
  }

  async remove(userId: number, id: number): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { id, userId } });
    } catch (error) {
      throw this.notFoundOr(error, id);
    }
  }

  private notFoundOr(error: unknown, id: number): unknown {
    const recordMissing =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025';
    return recordMissing
      ? new NotFoundException(`Task ${id} not found`)
      : error;
  }
}
