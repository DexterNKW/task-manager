import { Logger } from '@nestjs/common';
import { validateEnv } from './env.validation';

const secret = 'x'.repeat(32);

describe('validateEnv', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies defaults', () => {
    expect(validateEnv({ JWT_SECRET: secret })).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'file:./data/tasks.db',
      JWT_SECRET: secret,
      JWT_EXPIRES_IN_SECONDS: 3600,
    });
  });

  it('keeps DATABASE_URL so that values from .env reach the app', () => {
    expect(
      validateEnv({ JWT_SECRET: secret, DATABASE_URL: 'file:/tmp/custom.db' }),
    ).toMatchObject({ DATABASE_URL: 'file:/tmp/custom.db' });
  });

  it('requires JWT_SECRET in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      /JWT_SECRET is required/,
    );
  });

  it('generates a random secret outside production', () => {
    const first = validateEnv({}).JWT_SECRET;
    const second = validateEnv({}).JWT_SECRET;

    expect(first).toHaveLength(64);
    expect(first).not.toEqual(second);
  });

  it('rejects a short secret', () => {
    expect(() => validateEnv({ JWT_SECRET: 'short' })).toThrow(
      /at least 32 characters/,
    );
  });

  it('rejects a non-numeric port', () => {
    expect(() => validateEnv({ JWT_SECRET: secret, PORT: 'abc' })).toThrow(
      /PORT must be a positive integer/,
    );
  });

  it('parses numeric values from strings', () => {
    expect(
      validateEnv({
        JWT_SECRET: secret,
        PORT: '4000',
        JWT_EXPIRES_IN_SECONDS: '60',
      }),
    ).toMatchObject({ PORT: 4000, JWT_EXPIRES_IN_SECONDS: 60 });
  });
});
