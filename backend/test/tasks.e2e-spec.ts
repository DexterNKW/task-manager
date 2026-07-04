process.env.DB_PATH = ':memory:';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('performs a full create -> read -> update -> delete cycle', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: 'Buy milk' })
      .expect(201);

    expect(createRes.body).toMatchObject({
      title: 'Buy milk',
      completed: false,
    });
    const taskId = createRes.body.id;

    await request(app.getHttpServer())
      .get('/api/tasks')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
      });

    const updateRes = await request(app.getHttpServer())
      .put(`/api/tasks/${taskId}`)
      .send({ completed: true })
      .expect(200);

    expect(updateRes.body).toMatchObject({
      id: taskId,
      title: 'Buy milk',
      completed: true,
    });

    await request(app.getHttpServer())
      .delete(`/api/tasks/${taskId}`)
      .expect(204);

    await request(app.getHttpServer()).get('/api/tasks').expect(200).expect([]);
  });

  it('returns a uniform error body for a missing task', async () => {
    const res = await request(app.getHttpServer())
      .put('/api/tasks/999')
      .send({ title: 'x' })
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: expect.any(String),
      message: expect.any(String),
      path: '/api/tasks/999',
    });
  });

  it('rejects an empty title with a 400', () => {
    return request(app.getHttpServer())
      .post('/api/tasks')
      .send({ title: '' })
      .expect(400);
  });
});
