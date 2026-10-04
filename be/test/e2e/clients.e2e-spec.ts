import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

describe('clients (e2e)', () => {
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

  it('adds a client with a queued run and answers 201', async () => {
    const response = await addClient('yoast.com').expect(201);

    expect(response.body.client).toMatchObject({
      name: 'Yoast',
      websiteUrl: 'https://yoast.com',
      siteKey: 'yoast.com',
      currentPageCount: 0,
      latestRun: { status: 'queued', trigger: 'user', pagesDone: 0 },
    });
  });

  it('refuses an invalid URL with 400 INVALID_WEBSITE_URL', async () => {
    const response = await addClient('http://localhost:3000').expect(400);

    expect(response.body).toMatchObject({ errorCode: 'INVALID_WEBSITE_URL' });
  });

  it('refuses the same website spelled differently with 409 CLIENT_ALREADY_EXISTS', async () => {
    await addClient('https://yoast.com').expect(201);

    const response = await addClient(
      'https://www.yoast.com/blog',
      'Again',
    ).expect(409);
    expect(response.body).toMatchObject({ errorCode: 'CLIENT_ALREADY_EXISTS' });
  });

  it('two concurrent adds of one site: one 201, one 409', async () => {
    const statuses = await Promise.all([
      addClient('https://yoast.com'),
      addClient('https://www.yoast.com'),
    ]).then((responses) => responses.map((r) => r.status).sort());

    expect(statuses).toEqual([201, 409]);
  });

  it('refuses a re-crawl while a run is queued with 409 CRAWL_ALREADY_ACTIVE', async () => {
    const created = await addClient('yoast.com').expect(201);

    const response = await http()
      .post(`/api/clients/${created.body.client.id}/crawl-runs`)
      .set('Content-Type', 'application/json')
      .set('Cookie', cookie)
      .expect(409);
    expect(response.body).toMatchObject({ errorCode: 'CRAWL_ALREADY_ACTIVE' });
  });

  it('lists the clients with their latest run, by name', async () => {
    await addClient('yoast.com', 'Yoast').expect(201);
    await addClient('semrush.com', 'Semrush').expect(201);

    const response = await http()
      .get('/api/clients')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.items.map((c: { name: string }) => c.name)).toEqual([
      'Semrush',
      'Yoast',
    ]);
    expect(response.body.items[0]).toMatchObject({
      currentPageCount: 0,
      latestRun: { status: 'queued' },
    });
  });

  it('reads one client, and a run with its (empty) log', async () => {
    const created = await addClient('yoast.com').expect(201);
    const { id, latestRun } = created.body.client;

    await http()
      .get(`/api/clients/${id}`)
      .set('Cookie', cookie)
      .expect(200)
      .expect((r) => expect(r.body.client.id).toBe(id));

    const run = await http()
      .get(`/api/crawl-runs/${latestRun.id}`)
      .set('Cookie', cookie)
      .expect(200);
    expect(run.body.run).toMatchObject({
      id: latestRun.id,
      clientId: id,
      status: 'queued',
      sitemapUrl: null,
      items: [],
    });
  });

  it('answers 404 for a client id that does not exist', async () => {
    const response = await http()
      .get('/api/clients/999999')
      .set('Cookie', cookie)
      .expect(404);

    expect(response.body).toMatchObject({ errorCode: 'CLIENT_NOT_FOUND' });
  });
});
