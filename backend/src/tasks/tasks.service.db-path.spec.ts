import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('TasksService database path', () => {
  it('creates the database directory if it does not exist yet', () => {
    const testRoot = join(tmpdir(), `task-manager-test-${Date.now()}`);
    const dbDir = join(testRoot, 'nested');
    const dbPath = join(dbDir, 'tasks.db');
    expect(existsSync(dbDir)).toBe(false);

    process.env.DB_PATH = dbPath;
    jest.resetModules();

    const { TasksService } =
      jest.requireActual<typeof import('./tasks.service')>('./tasks.service');
    const service = new TasksService();

    expect(existsSync(dbDir)).toBe(true);
    expect(existsSync(dbPath)).toBe(true);

    (service as unknown as { db: { close: () => void } }).db.close();
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.DB_PATH;
  });
});
