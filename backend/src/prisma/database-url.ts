export const DEFAULT_DATABASE_URL = 'file:./data/tasks.db';

export function databaseUrl(
  env: Record<string, unknown> = process.env,
): string {
  return typeof env.DATABASE_URL === 'string' && env.DATABASE_URL
    ? env.DATABASE_URL
    : DEFAULT_DATABASE_URL;
}
