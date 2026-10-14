import { Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { databaseUrl } from '../prisma/database-url';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_JWT_EXPIRES_IN_SECONDS = 3600;

export interface EnvironmentVariables {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN_SECONDS: number;
}

function positiveInteger(
  name: string,
  value: unknown,
  fallback: number,
): number {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `${name} must be a positive integer, got ${JSON.stringify(value)}`,
    );
  }
  return parsed;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnv =
    typeof config.NODE_ENV === 'string' ? config.NODE_ENV : 'development';
  let jwtSecret =
    typeof config.JWT_SECRET === 'string' ? config.JWT_SECRET : '';

  if (!jwtSecret) {
    if (nodeEnv === 'production') {
      throw new Error('JWT_SECRET is required when NODE_ENV=production');
    }
    // A per-process secret keeps local setup zero-config without ever shipping
    // a known key; the cost is that tokens stop working after a restart.
    jwtSecret = randomBytes(MIN_SECRET_LENGTH).toString('hex');
    new Logger('Config').warn(
      'JWT_SECRET is not set: using a random secret, tokens will be invalidated on restart',
    );
  } else if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: positiveInteger('PORT', config.PORT, 3000),
    DATABASE_URL: databaseUrl(config),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN_SECONDS: positiveInteger(
      'JWT_EXPIRES_IN_SECONDS',
      config.JWT_EXPIRES_IN_SECONDS,
      DEFAULT_JWT_EXPIRES_IN_SECONDS,
    ),
  };
}
