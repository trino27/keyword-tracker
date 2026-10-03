import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app/app.module';
import { configureApp } from '../../src/core/bootstrap/configure-app';

/**
 * The real application — AppModule plus the same `configureApp` wiring `main.ts`
 * uses — against the test database. An e2e test that builds a smaller module or
 * skips the wiring would stop covering whatever it left out, silently.
 */
export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bufferLogs: true,
  });
  configureApp(app);
  await app.init();
  return app;
}
