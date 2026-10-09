import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

describe('search updates (e2e, recorded status dashboard)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
    await testDb.reset();
    await seedTestUser(testDb, 'manager@example.com');
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it("lists Google's ranking updates from the recorded dashboard, newest first", async () => {
    const cookie = await signIn(app, 'manager@example.com');

    const response = await request(app.getHttpServer())
      .get('/api/search-updates')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.available).toBe(true);
    expect(response.body.updates).toHaveLength(8);
    expect(response.body.updates[3]).toEqual({
      id: 'wdAXJk6LRRihEjpzEeWE',
      title: 'May 2026 core update',
      kind: 'core',
      begin: '2026-05-21T15:40:00.000Z',
      end: expect.any(String) as string,
      url: 'https://status.search.google.com/incidents/wdAXJk6LRRihEjpzEeWE',
    });
  });
});
