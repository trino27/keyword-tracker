import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app';
import { listRoutes } from '../support/list-routes';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

/** An id no row will ever have — the "missing" answer the intruder's must equal. */
const MISSING_ID = 2_000_000_000;

interface IIsolationContext {
  http: () => request.Agent;
  /** Cookie of user A, who owns the objects each case creates. */
  ownerCookie: string;
  /** Cookie of user B, who must not reach anything user A owns. */
  intruderCookie: string;
  /** A fresh client owned by A (a new site each call); returns its id and first run id. */
  createOwnedClient: () => Promise<{ clientId: number; runId: number }>;
}

type TMethod = 'get' | 'post';

/**
 * User B asking for user A's object must get exactly what asking for a missing object
 * gets — status and body — so an id cannot even be probed for existence.
 */
async function expectSameAsMissing(
  context: IIsolationContext,
  method: TMethod,
  pathFor: (id: number) => string,
  ownedId: number,
): Promise<void> {
  const foreign = await context
    .http()
    [method](pathFor(ownedId))
    .set('Cookie', context.intruderCookie);
  const missing = await context
    .http()
    [method](pathFor(MISSING_ID))
    .set('Cookie', context.intruderCookie);

  expect(foreign.status).toBe(404);
  expect({ status: foreign.status, body: foreign.body as unknown }).toEqual({
    status: missing.status,
    body: missing.body as unknown,
  });
}

/**
 * One case per route that takes an id (or a clientId in the query). The static test
 * below fails the moment such a route exists without a case here.
 */
const ISOLATION_MATRIX: Record<
  string,
  (context: IIsolationContext) => Promise<void>
> = {
  'GET /api/clients/:id': async (context) => {
    const { clientId } = await context.createOwnedClient();
    await expectSameAsMissing(
      context,
      'get',
      (id) => `/api/clients/${id}`,
      clientId,
    );
  },
  'POST /api/clients/:id/crawl-runs': async (context) => {
    const { clientId } = await context.createOwnedClient();
    await expectSameAsMissing(
      context,
      'post',
      (id) => `/api/clients/${id}/crawl-runs`,
      clientId,
    );
  },
  'GET /api/pages': async (context) => {
    const { clientId } = await context.createOwnedClient();
    await expectSameAsMissing(
      context,
      'get',
      (id) => `/api/pages?clientId=${id}`,
      clientId,
    );
  },
  'GET /api/crawl-runs/:id': async (context) => {
    const { runId } = await context.createOwnedClient();
    await expectSameAsMissing(
      context,
      'get',
      (id) => `/api/crawl-runs/${id}`,
      runId,
    );
  },
};

/** Routes that take an owned id through the query string rather than the path. */
const QUERY_SCOPED_ROUTES = ['GET /api/pages'];

describe('isolation matrix (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => testDb.reset());

  afterAll(async () => {
    await app.close();
    await testDb.close();
  });

  it('covers every route that takes an id or a clientId', () => {
    const scopedRoutes = listRoutes(app)
      .filter(
        (route) =>
          route.path.includes(':') || QUERY_SCOPED_ROUTES.includes(route.key),
      )
      .map((route) => route.key);

    expect(Object.keys(ISOLATION_MATRIX).sort()).toEqual(scopedRoutes.sort());
  });

  it.each(Object.keys(ISOLATION_MATRIX))(
    "%s: user B gets the not-found answer for user A's object",
    async (route) => {
      await seedTestUser(testDb, 'owner@example.com');
      await seedTestUser(testDb, 'intruder@example.com');
      const http = () => request.agent(app.getHttpServer());
      const ownerCookie = await signIn(app, 'owner@example.com');
      let site = 0;

      const context: IIsolationContext = {
        http,
        ownerCookie,
        intruderCookie: await signIn(app, 'intruder@example.com'),
        createOwnedClient: async () => {
          site += 1;
          const response = await http()
            .post('/api/clients')
            .set('Cookie', ownerCookie)
            .send({
              name: `Site ${site}`,
              websiteUrl: `site-${site}.example.com`,
            })
            .expect(201);
          const client = response.body.client as {
            id: number;
            latestRun: { id: number };
          };
          return { clientId: client.id, runId: client.latestRun.id };
        },
      };

      await expect(ISOLATION_MATRIX[route](context)).resolves.toBeUndefined();
    },
  );
});
