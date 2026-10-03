import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app/app.module';
import { configureApp } from '../../src/core/bootstrap/configure-app';
import { FixtureHttpTransport } from '../../src/infrastructure/remote-api/_testing/fixture-http-transport';
import { HTTP_TRANSPORT } from '../../src/infrastructure/remote-api/http-transport/http-transport.interface';

export interface ITestAppOptions {
  /** What the crawler's network is; the recorded fixtures by default. */
  transport?: FixtureHttpTransport;
}

/**
 * The real application — AppModule plus the same `configureApp` wiring `main.ts`
 * uses — against the test database. An e2e test that builds a smaller module or
 * skips the wiring would stop covering whatever it left out, silently.
 *
 * The one substitution is the HTTP transport: no test may reach a live website.
 */
export async function createTestApp(
  options: ITestAppOptions = {},
): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(HTTP_TRANSPORT)
    .useValue(options.transport ?? new FixtureHttpTransport())
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bufferLogs: true,
  });
  configureApp(app);
  await app.init();
  return app;
}
