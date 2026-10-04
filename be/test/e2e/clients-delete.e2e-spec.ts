import type { NestExpressApplication } from '@nestjs/platform-express';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app';
import { seedCurrentPage } from '../support/seed-page';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

/** Its own app: adding clients is rate-limited per user, and clients.e2e-spec uses the budget. */
describe('deleting a client (e2e)', () => {
  let app: NestExpressApplication;
  let cookie: string;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await testDb.reset();
    await seedTestUser(testDb, 'manager@example.com');
    cookie = await signIn(app, 'manager@example.com');
  });

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  const addClient = (websiteUrl: string, name = 'Yoast') =>
    http()
      .post('/api/clients')
      .set('Cookie', cookie)
      .send({ name, websiteUrl });

  it('deletes a client with its runs and pages; the site can then be added again', async () => {
    const created = await addClient('yoast.com').expect(201);
    const { id, latestRun } = created.body.client;
    const owner = await testDb.db.execute<{ user_id: string }>(
      sql`select user_id from clients where id = ${id}`,
    );
    await seedCurrentPage(testDb, Number(owner.rows[0].user_id), ['seo'], id);

    await http()
      .delete(`/api/clients/${id}`)
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .expect(204);

    await http().get(`/api/clients/${id}`).set('Cookie', cookie).expect(404);
    await http()
      .get(`/api/crawl-runs/${latestRun.id}`)
      .set('Cookie', cookie)
      .expect(404);
    const left = await testDb.db.execute<{ pages: string }>(
      sql`select count(*) as pages from pages where client_id = ${id}`,
    );
    expect(Number(left.rows[0].pages)).toBe(0);
    await addClient('yoast.com').expect(201);
  });

  it('deleting a missing client is a 404', async () => {
    const response = await http()
      .delete('/api/clients/999999')
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .expect(404);

    expect(response.body).toMatchObject({ errorCode: 'CLIENT_NOT_FOUND' });
  });
});
