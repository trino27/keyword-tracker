import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import type { Logger } from 'pino';

/** `pg` waits forever by default; an unreachable database must fail, not hang. */
const CONNECT_TIMEOUT_MS = 15_000;

export interface IRunMigrationsOptions {
  databaseUrl: string;
  migrationsFolder: string;
  logger: Logger;
}

/**
 * Creates the database when it is missing, then applies the generated migrations.
 *
 * Shared by the `migrate` CLI and the database test runner, so the tests run against
 * a schema built exactly the way production builds it.
 */
export async function runMigrations({
  databaseUrl,
  migrationsFolder,
  logger,
}: IRunMigrationsOptions): Promise<void> {
  await ensureDatabaseExists(databaseUrl, logger);

  if (!existsSync(`${migrationsFolder}/meta/_journal.json`)) {
    logger.info('No migrations generated yet — nothing to apply');
    return;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  try {
    await migrate(drizzle(pool), { migrationsFolder });
    logger.info('Migrations applied');
  } finally {
    await pool.end();
  }
}

async function ensureDatabaseExists(
  databaseUrl: string,
  logger: Logger,
): Promise<void> {
  const databaseName = decodeURIComponent(
    new URL(databaseUrl).pathname.replace(/^\//, ''),
  );
  if (!databaseName || databaseName === 'postgres') return;

  const admin = new URL(databaseUrl);
  admin.pathname = '/postgres';
  const pool = new Pool({
    connectionString: admin.toString(),
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  try {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (rowCount === 0) {
      // Identifiers cannot be bound as parameters; the name comes from our own env.
      await pool.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
      logger.info({ databaseName }, 'Database created');
    }
  } finally {
    await pool.end();
  }
}
