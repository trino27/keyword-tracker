import '../core/bootstrap/tz'; // MUST stay first — pins the process to UTC before any Date exists
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { EnvKeys } from '../infrastructure/config/env-keys.constant';
import { MIN_SEED_PASSWORD_LENGTH } from '../infrastructure/config/env.schema/env.schema';
import { CrawlWorker } from '../modules/crawl/workers/crawl-worker/crawl-worker';
import { SeedModule } from './seed.module';
import { SeedRunner } from './seed-runner/seed-runner.service';

/**
 * `pnpm seed` / `docker compose run --rm seed` — idempotent; run it again at any time.
 *   --positions-only   fill positions only: no accounts, no crawls
 */
async function main(): Promise<number> {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  // Read through the config module, which has already rejected a too-short value at
  // boot; what is left to check here is that it was set at all.
  const password =
    app.get(ConfigService).get<string>(EnvKeys.SEED_USER_PASSWORD) ?? '';
  if (password.length < MIN_SEED_PASSWORD_LENGTH) {
    console.error(
      `SEED_USER_PASSWORD must be set, at least ${MIN_SEED_PASSWORD_LENGTH} characters.`,
    );
    await app.close();
    return 1;
  }
  try {
    // The seed executes its own crawls rather than relying on an API process being up.
    await app.get(CrawlWorker).start();
    const report = await app.get(SeedRunner).run({
      password,
      positionsOnly: process.argv.includes('--positions-only'),
    });

    for (const crawl of report.crawls) {
      console.log(
        `crawl  ${crawl.client.padEnd(8)} ${crawl.status}${crawl.runId ? ` (run ${crawl.runId})` : ''}`,
      );
    }
    const { pairs, days, rowsAdded, total } = report.positions;
    console.log(
      `positions  ${pairs} keyword pairs, ${days} days: ${rowsAdded} rows added, ${total} in total`,
    );
    return 0;
  } catch (error: unknown) {
    console.error(
      `seed failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  } finally {
    await app.close();
  }
}

void main().then((code) => process.exit(code));
