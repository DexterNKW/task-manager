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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TasksService } = require('./tasks.service');
    const service = new (TasksService as new () => {
      db: { close: () => void };
    })();

    expect(existsSync(dbDir)).toBe(true);
    expect(existsSync(dbPath)).toBe(true);

    service.db.close();
    rmSync(testRoot, { recursive: true, force: true });
    delete process.env.DB_PATH;
  });
});
