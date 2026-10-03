import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Database } from '../../src/persistence/connections/postgres/database-provider/database.provider';
import { databaseSchema } from '../../src/persistence/schema/database-schema/database-schema';
import { resetDatabase } from './reset-database';

export interface ITestDatabase {
  db: Database;
  /** Empties every application table — call it in `beforeEach`. */
  reset: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * A Drizzle handle on the guarded test database (`db-env.ts` has already pointed
 * DATABASE_URL at it), for repository integration specs.
 */
export function createTestDatabase(): ITestDatabase {
  const databaseUrl = process.env.DATABASE_URL as string;
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  return {
    db: drizzle(pool, { schema: databaseSchema }),
    reset: () => resetDatabase(databaseUrl),
    close: () => pool.end(),
  };
}
