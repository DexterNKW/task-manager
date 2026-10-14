import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestDatabase } from './test-database';

export interface TestApp {
  app: INestApplication<App>;
  close: () => Promise<void>;
}

export async function createTestApp(
  options: { throttle?: boolean } = {},
): Promise<TestApp> {
  const database = createTestDatabase();

  // ConfigModule validates the environment once per process, so the database
  // of each test app is wired here instead of through DATABASE_URL.
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(
      new PrismaService(new ConfigService({ DATABASE_URL: database.url })),
    );
  if (!options.throttle) {
    // Most suites register and log in more often than the production limit.
    builder = builder
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true });
  }
  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();

  return {
    app,
    close: async () => {
      await app.close();
      await app.get(PrismaService).$disconnect();
      database.remove();
    },
  };
}

export async function registerUser(
  app: INestApplication<App>,
  email: string,
  password = 'correct horse battery',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password })
    .expect(201);
  return (res.body as { accessToken: string }).accessToken;
}
