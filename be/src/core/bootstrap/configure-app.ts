import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as NestPinoLogger } from 'nestjs-pino';
import { API_PREFIX } from '@app/contracts';

/**
 * The imperative wiring the HTTP server needs, in the order it must run.
 *
 * Called by `main.ts` and by any e2e harness against the same kind of app object,
 * so the suite exercises the real pipeline: the global prefix decides whether a
 * route answers at all, and that fails at the HTTP boundary with every unit test
 * still green.
 */
export function configureApp(app: NestExpressApplication): void {
  // Express advertises itself on every response; a scanner gets the framework for free.
  app.set('x-powered-by', false);
  // One reverse-proxy hop (Caddy), so `req.ip` honours X-Forwarded-For.
  app.set('trust proxy', 1);

  app.useLogger(app.get(NestPinoLogger));
  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();
}
