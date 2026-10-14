export const DEFAULT_DATABASE_URL = 'file:./data/tasks.db';

export function databaseUrl(): string {
  return process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
}
