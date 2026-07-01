import { Injectable, NotFoundException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

interface TaskRow {
  id: number;
  title: string;
  completed: number;
  createdAt: string;
  dueDate?: string | null;
}

@Injectable()
export class TasksService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('tasks.db');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        dueDate TEXT
      )
    `);
  }

  private toTask(row: TaskRow): Task {
    return {
      id: row.id,
      title: row.title,
      completed: Boolean(row.completed),
      createdAt: new Date(row.createdAt),
      dueDate: row.dueDate ? new Date(row.dueDate) : null,
    };
  }

  findAll(): Task[] {
    const rows = this.db.prepare('SELECT * FROM tasks ORDER BY dueDate IS NULL, dueDate ASC').all() as TaskRow[];
    return rows.map((r) => this.toTask(r));
  }

  findOne(id: number): Task {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
    if (!row) throw new NotFoundException(`Task ${id} not found`);
    return this.toTask(row);
  }

  create(dto: CreateTaskDto): Task {
    const createdAt = new Date().toISOString();
    const result = this.db
      .prepare('INSERT INTO tasks (title, completed, createdAt, dueDate) VALUES (?, 0, ?, ?)')
      .run(dto.title, createdAt, dto.dueDate ? dto.dueDate : null);
    return {
      id: result.lastInsertRowid as number,
      title: dto.title,
      completed: false,
      createdAt: new Date(createdAt),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
    };
  }

  update(id: number, dto: UpdateTaskDto): Task {
    const task = this.findOne(id); 

    const title = dto.title ?? task.title;
    const completed = dto.completed ?? task.completed;
    const createdAt = dto.createdAt ? new Date(dto.createdAt) : task.createdAt;
    let dueDate: Date | null;
    if (dto.dueDate === undefined) {
      dueDate = task.dueDate ?? null;
    } else if (dto.dueDate === null) {
      dueDate = null;
    } else {
      dueDate = new Date(dto.dueDate);
    }
    this.db
      .prepare('UPDATE tasks SET title = ?, completed = ?, createdAt = ?, dueDate = ? WHERE id = ?')
      .run(title, completed ? 1 : 0, createdAt.toISOString(), dueDate ? dueDate.toISOString() : null, id);

    return this.findOne(id);
  }

  remove(id: number): void {
    const result = this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    if (result.changes === 0) throw new NotFoundException(`Task ${id} not found`);
  }
}