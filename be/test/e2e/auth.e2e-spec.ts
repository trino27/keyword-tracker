import type { NestExpressApplication } from '@nestjs/platform-express';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { sessions } from '../../src/persistence/schema/tables/sessions/sessions.schema';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn, TEST_PASSWORD } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

const cookieOf = (response: request.Response): string | undefined =>
  ([] as string[])
    .concat(response.headers['set-cookie'] ?? [])
    .find((value) => value.startsWith('sid='));

describe('auth (e2e)', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => testDb.reset());

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('login sets an HttpOnly, SameSite=Lax session cookie for 7 days and returns the user', async () => {
    const user = await seedTestUser(testDb, 'login@example.com');

    const response = await http()
      .post('/api/auth/login')
      .send({ email: 'Login@Example.com', password: TEST_PASSWORD })
      .expect(200);

    expect(response.body).toEqual({
      user: {
        id: user.id,
        email: 'login@example.com',
        timeZone: 'America/Toronto',
      },
    });
    const cookie = cookieOf(response) ?? '';
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\//);
    expect(cookie).toMatch(/Max-Age=604800/);
    // Plain HTTP: a Secure cookie would never be sent back.
    expect(cookie).not.toMatch(/Secure/);
  });

  it('me returns the user with their time zone', async () => {
    const user = await seedTestUser(testDb, 'me@example.com', 'Europe/Kyiv');
    const cookie = await signIn(app, 'me@example.com');

    const response = await http()
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body).toEqual({
      user: { id: user.id, email: 'me@example.com', timeZone: 'Europe/Kyiv' },
    });
  });

  it('logout answers 204, clears the cookie, and the session no longer works', async () => {
    await seedTestUser(testDb, 'logout@example.com');
    const cookie = await signIn(app, 'logout@example.com');

    const response = await http()
      .post('/api/auth/logout')
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .expect(204);

    expect(cookieOf(response)).toMatch(/sid=;/);
    await http().get('/api/auth/me').set('Cookie', cookie).expect(401);
  });

  it('answers an unknown email and a wrong password identically', async () => {
    await seedTestUser(testDb, 'known@example.com');

    const unknown = await http()
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });
    const wrong = await http()
      .post('/api/auth/login')
      .send({ email: 'known@example.com', password: 'wrong password' });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(unknown.body).toMatchObject({ errorCode: 'INVALID_CREDENTIALS' });
    expect(cookieOf(unknown)).toBeUndefined();
  });

  it('the 11th login attempt for one email within a minute is 429', async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt++) {
      const response = await http()
        .post('/api/auth/login')
        .send({ email: 'throttled@example.com', password: 'wrong password' });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
    expect(statuses[10]).toBe(429);
  });

  it('a login that is not application/json is refused with 415', async () => {
    const response = await http()
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send('email=a@example.com&password=x')
      .expect(415);

    expect(response.body).toMatchObject({ errorCode: 'JSON_REQUIRED' });
  });

  it('an expired session answers 401 SESSION_REQUIRED', async () => {
    await seedTestUser(testDb, 'expired@example.com');
    const cookie = await signIn(app, 'expired@example.com');
    await testDb.db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() - 1000) });

    const response = await http()
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(401);

    expect(response.body).toMatchObject({ errorCode: 'SESSION_REQUIRED' });
  });

  it('the session row holds sha256 of the cookie value, never the value itself', async () => {
    await seedTestUser(testDb, 'hash@example.com');
    const cookie = await signIn(app, 'hash@example.com');
    const token = cookie.slice('sid='.length);

    const [row] = await testDb.db.select().from(sessions);

    expect(
      row.tokenHash.equals(createHash('sha256').update(token).digest()),
    ).toBe(true);
    expect(row.tokenHash.toString('utf8')).not.toContain(token);
  });
});
