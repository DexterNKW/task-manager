import request from 'supertest';
import { createTestApp, registerUser, TestApp } from './support/test-app';

describe('Tasks (e2e)', () => {
  let testApp: TestApp;
  let token: string;

  beforeEach(async () => {
    testApp = await createTestApp();
    token = await registerUser(testApp.app, 'alice@example.com');
  });

  afterEach(async () => {
    await testApp.close();
  });

  const api = () => request(testApp.app.getHttpServer());

  it('performs a full create -> read -> update -> delete cycle', async () => {
    const createRes = await api()
      .post('/api/tasks')
      .auth(token, { type: 'bearer' })
      .send({ title: 'Buy milk' })
      .expect(201);

    expect(createRes.body).toMatchObject({
      title: 'Buy milk',
      completed: false,
    });
    const taskId = (createRes.body as { id: number }).id;

    await api()
      .get('/api/tasks')
      .auth(token, { type: 'bearer' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
      });

    const updateRes = await api()
      .put(`/api/tasks/${taskId}`)
      .auth(token, { type: 'bearer' })
      .send({ completed: true })
      .expect(200);

    expect(updateRes.body).toMatchObject({
      id: taskId,
      title: 'Buy milk',
      completed: true,
    });

    await api()
      .delete(`/api/tasks/${taskId}`)
      .auth(token, { type: 'bearer' })
      .expect(204);

    await api()
      .get('/api/tasks')
      .auth(token, { type: 'bearer' })
      .expect(200)
      .expect([]);
  });

  it('returns a uniform error body for a missing task', async () => {
    const res = await api()
      .put('/api/tasks/999')
      .auth(token, { type: 'bearer' })
      .send({ title: 'x' })
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      error: expect.any(String) as string,
      message: expect.any(String) as string,
      path: '/api/tasks/999',
    });
  });

  it('rejects an empty title with a 400', () => {
    return api()
      .post('/api/tasks')
      .auth(token, { type: 'bearer' })
      .send({ title: '' })
      .expect(400);
  });

  it('ignores a userId sent in the body', async () => {
    const bobToken = await registerUser(testApp.app, 'bob@example.com');

    await api()
      .post('/api/tasks')
      .auth(token, { type: 'bearer' })
      .send({ title: 'Mine', userId: 2 })
      .expect(201);

    await api()
      .get('/api/tasks')
      .auth(bobToken, { type: 'bearer' })
      .expect(200)
      .expect([]);
  });

  describe('authentication', () => {
    it('rejects requests without a token', () => {
      return api().get('/api/tasks').expect(401);
    });

    it('rejects a malformed token', () => {
      return api()
        .get('/api/tasks')
        .auth('not-a-jwt', { type: 'bearer' })
        .expect(401);
    });
  });

  describe('ownership', () => {
    let bobToken: string;
    let aliceTaskId: number;

    beforeEach(async () => {
      bobToken = await registerUser(testApp.app, 'bob@example.com');
      const res = await api()
        .post('/api/tasks')
        .auth(token, { type: 'bearer' })
        .send({ title: 'Private' })
        .expect(201);
      aliceTaskId = (res.body as { id: number }).id;
    });

    it('does not list tasks of other users', () => {
      return api()
        .get('/api/tasks')
        .auth(bobToken, { type: 'bearer' })
        .expect(200)
        .expect([]);
    });

    it('answers 404 when updating a task of another user', () => {
      return api()
        .put(`/api/tasks/${aliceTaskId}`)
        .auth(bobToken, { type: 'bearer' })
        .send({ completed: true })
        .expect(404);
    });

    it('answers 404 when deleting a task of another user', async () => {
      await api()
        .delete(`/api/tasks/${aliceTaskId}`)
        .auth(bobToken, { type: 'bearer' })
        .expect(404);

      await api()
        .get('/api/tasks')
        .auth(token, { type: 'bearer' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(1);
        });
    });
  });
});
