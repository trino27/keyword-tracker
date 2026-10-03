import type { NestExpressApplication } from '@nestjs/platform-express';
import { createTestApp } from '../support/create-test-app';
import { listRoutes } from '../support/list-routes';
import { seedTestUser, signIn } from '../support/sign-in';
import { createTestDatabase } from '../support/test-database';

const testDb = createTestDatabase();

interface IIsolationContext {
  app: NestExpressApplication;
  /** Cookie of user B, who must not reach anything user A owns. */
  intruderCookie: string;
  /** Cookie of user A, who owns the objects each case creates. */
  ownerCookie: string;
}

/**
 * For every route that takes an id or a clientId: user B asking for user A's object
 * gets exactly the answer a missing object gets (404, same body). Each case creates
 * A's object itself and asserts B's response.
 *
 * Filled from phase 3 on, as the routes appear. The static test below fails the moment
 * a route with a path parameter exists without a case here.
 */
const ISOLATION_MATRIX: Record<
  string,
  (context: IIsolationContext) => Promise<void>
> = {};

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

  it("refuses user B every one of user A's objects with the not-found answer", async () => {
    await seedTestUser(testDb, 'owner@example.com');
    await seedTestUser(testDb, 'intruder@example.com');
    const context: IIsolationContext = {
      app,
      ownerCookie: await signIn(app, 'owner@example.com'),
      intruderCookie: await signIn(app, 'intruder@example.com'),
    };

    for (const [route, assertIsolated] of Object.entries(ISOLATION_MATRIX)) {
      await testDb.reset();
      await expect(assertIsolated(context)).resolves.toBeUndefined();
      expect(route).toBeDefined();
    }
    expect(context.intruderCookie).not.toBe(context.ownerCookie);
  });
});
