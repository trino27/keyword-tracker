import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../support/create-test-app';
import { listRoutes } from '../support/list-routes';

/**
 * Default deny, proven over the routes the application actually registers.
 *
 * The list is read from Nest's metadata, so a new controller is covered the moment it
 * exists: it either carries @Public() — and then breaks the first assertion until the
 * list below is consciously extended — or it answers 401 without a session.
 */
const PUBLIC_ROUTES = ['GET /api/health', 'POST /api/auth/login'];

describe('default deny (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('the @Public routes are exactly POST /api/auth/login and GET /api/health', () => {
    const publicKeys = listRoutes(app)
      .filter((route) => route.isPublic)
      .map((route) => route.key);

    expect(publicKeys).toEqual(PUBLIC_ROUTES);
  });

  it('every non-public route answers 401 without a session', async () => {
    const guarded = listRoutes(app).filter((route) => !route.isPublic);
    expect(guarded.length).toBeGreaterThan(0);

    for (const route of guarded) {
      // Path params get a harmless value; the guard runs before any pipe parses them.
      const path = route.path.replace(/:[^/]+/g, '1');
      const response = await request(app.getHttpServer())
        [route.method.toLowerCase() as 'get'](path)
        .set('Content-Type', 'application/json');

      expect({ route: route.key, status: response.status }).toEqual({
        route: route.key,
        status: 401,
      });
      expect(response.body).toMatchObject({ errorCode: 'SESSION_REQUIRED' });
    }
  });
});
