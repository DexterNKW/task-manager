import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { createTestApp, registerUser, TestApp } from './support/test-app';

interface AuthBody {
  accessToken: string;
  user: { id: number; email: string };
}

describe('Auth (e2e)', () => {
  let testApp: TestApp;

  afterEach(async () => {
    await testApp.close();
  });

  const api = () => request(testApp.app.getHttpServer());

  describe('without throttling', () => {
    beforeEach(async () => {
      testApp = await createTestApp();
    });

    it('registers a user and returns a token without the password hash', async () => {
      const res = await api()
        .post('/api/auth/register')
        .send({ email: '  Alice@Example.com ', password: 'correct horse' })
        .expect(201);

      const body = res.body as AuthBody;
      expect(body.accessToken).toEqual(expect.any(String));
      expect(body.user).toEqual({
        id: expect.any(Number) as number,
        email: 'alice@example.com',
        createdAt: expect.any(String) as string,
      });
    });

    it('rejects a duplicate email with 409', async () => {
      await registerUser(testApp.app, 'alice@example.com');

      await api()
        .post('/api/auth/register')
        .send({ email: 'ALICE@example.com', password: 'another password' })
        .expect(409);
    });

    it.each([
      ['an invalid email', { email: 'nope', password: 'long enough' }],
      ['a short password', { email: 'a@example.com', password: 'short' }],
      [
        'a password over 72 bytes',
        { email: 'a@example.com', password: 'é'.repeat(37) },
      ],
    ])('rejects %s with 400', (_case, body) => {
      return api().post('/api/auth/register').send(body).expect(400);
    });

    it('logs in with the right password', async () => {
      await registerUser(testApp.app, 'alice@example.com', 'correct horse');

      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'correct horse' })
        .expect(200);

      const token = (res.body as AuthBody).accessToken;
      await api()
        .get('/api/auth/me')
        .auth(token, { type: 'bearer' })
        .expect(200)
        .expect((me) => {
          expect(me.body).toMatchObject({ email: 'alice@example.com' });
          expect(me.body).not.toHaveProperty('passwordHash');
        });
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      await registerUser(testApp.app, 'alice@example.com', 'correct horse');

      const wrongPassword = await api()
        .post('/api/auth/login')
        .send({ email: 'alice@example.com', password: 'wrong horse' })
        .expect(401);
      const unknownEmail = await api()
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'correct horse' })
        .expect(401);

      expect((wrongPassword.body as { message: string }).message).toBe(
        'Invalid email or password',
      );
      expect((unknownEmail.body as { message: string }).message).toBe(
        'Invalid email or password',
      );
    });

    it('rejects an expired token', async () => {
      await registerUser(testApp.app, 'alice@example.com');
      const expired = await testApp.app
        .get(JwtService)
        .signAsync({ sub: 1 }, { expiresIn: -1 });

      await api()
        .get('/api/auth/me')
        .auth(expired, { type: 'bearer' })
        .expect(401);
    });

    it('rejects a token signed with another secret', async () => {
      await registerUser(testApp.app, 'alice@example.com');
      const forged = await new JwtService({
        secret: 'another-secret-that-is-at-least-32-chars',
      }).signAsync({ sub: 1 });

      await api()
        .get('/api/auth/me')
        .auth(forged, { type: 'bearer' })
        .expect(401);
    });
  });

  describe('with throttling', () => {
    beforeEach(async () => {
      testApp = await createTestApp({ throttle: true });
    });

    it('limits login attempts to 10 per minute', async () => {
      for (let attempt = 0; attempt < 10; attempt++) {
        await api()
          .post('/api/auth/login')
          .send({ email: 'nobody@example.com', password: 'wrong password' })
          .expect(401);
      }

      await api()
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong password' })
        .expect(429);
    });
  });
});
