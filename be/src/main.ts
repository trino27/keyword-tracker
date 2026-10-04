import './core/bootstrap/tz'; // MUST stay first — pins the process to UTC before any Date exists
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { configureApp } from './core/bootstrap/configure-app';
import { EnvKeys } from './infrastructure/config/env-keys.constant';
import { bootstrapLogger } from './infrastructure/observability/logger/logger.bootstrap';

const DEFAULT_PORT = 3000;

const logger = bootstrapLogger.child({ name: 'Bootstrap' });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  configureApp(app);

  const port = Number(
    app.get(ConfigService).get<string>(EnvKeys.PORT) ?? DEFAULT_PORT,
  );
  await app.listen(port, '0.0.0.0');
  logger.info({ port }, 'Server started');
}

process.on('unhandledRejection', (reason: unknown) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught exception — shutting down');
  process.exit(1);
});

void bootstrap();
