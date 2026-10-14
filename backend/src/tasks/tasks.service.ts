import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Task[]> {
    return this.prisma.task.findMany({
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }],
    });
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  create(dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    // undefined leaves the due date unchanged, null clears it.
    const dueDate =
      dto.dueDate === undefined
        ? undefined
        : dto.dueDate === null
          ? null
          : new Date(dto.dueDate);
    try {
      return await this.prisma.task.update({
        where: { id },
        data: { title: dto.title, completed: dto.completed, dueDate },
      });
    } catch (error) {
      throw this.notFoundOr(error, id);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { id } });
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
