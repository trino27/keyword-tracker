import { join } from 'node:path';
import pino from 'pino';
import { runMigrations } from '../../src/persistence/migrations/run-migrations/run-migrations';
import { assertTestDatabase } from './assert-test-database/assert-test-database';

/**
 * Jest `globalSetup` for the database tests: refuses a non-`_test` database, creates
 * it when missing and applies the generated migrations — the same way production
 * builds its schema.
 *
 * An unreachable database FAILS the run. A suite that skips itself when its database
 * is missing reports green while testing nothing, which is worse than no suite.
 */
export default async function dbGlobalSetup(): Promise<void> {
  const databaseUrl = assertTestDatabase(process.env.TEST_DATABASE_URL);

  try {
    await runMigrations({
      databaseUrl,
      migrationsFolder: join(__dirname, '..', '..', 'drizzle'),
      logger: pino({ level: 'warn' }),
    });
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Preparing the test database failed: ${reason}. Is Postgres running? Start it with \`pnpm dev:db\`.`,
      { cause: error },
    );
  }
}
