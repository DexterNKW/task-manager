import Database from 'better-sqlite3';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const migrationsDir = join(__dirname, '..', '..', 'prisma', 'migrations');

export interface TestDatabase {
  url: string;
  remove: () => void;
}

// Each test gets its own SQLite file built from the real migrations, so the
// schema under test is exactly the one `prisma migrate deploy` produces.
export function createTestDatabase(): TestDatabase {
  const dir = mkdtempSync(join(tmpdir(), 'task-manager-test-'));
  const file = join(dir, 'test.db');
  const db = new Database(file);
  try {
    for (const migration of readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()) {
      db.exec(
        readFileSync(join(migrationsDir, migration, 'migration.sql'), 'utf8'),
      );
    }
  } finally {
    db.close();
  }
  return {
    url: `file:${file}`,
    remove: () => rmSync(dir, { recursive: true, force: true }),
  };
}
