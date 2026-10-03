import '../core/bootstrap/tz'; // MUST stay first — pins the process to UTC before any Date exists
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { CrawlWorker } from '../modules/crawl/workers/crawl-worker/crawl-worker';
import { SeedModule } from './seed.module';
import { SeedRunner } from './seed-runner/seed-runner.service';

const MIN_PASSWORD_LENGTH = 8;

/**
 * `pnpm seed` / `docker compose run --rm seed` — idempotent; run it again at any time.
 *   --positions-only   fill positions only: no accounts, no crawls
 */
async function main(): Promise<number> {
  const password = process.env.SEED_USER_PASSWORD ?? '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `SEED_USER_PASSWORD must be set, at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
    return 1;
  }

  const app = await NestFactory.createApplicationContext(SeedModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
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
