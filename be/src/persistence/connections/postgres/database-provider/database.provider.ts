import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvKeys } from '@infrastructure/config/env-keys.constant';
import { bootstrapLogger } from '@infrastructure/observability/logger/logger.bootstrap';
import {
  databaseSchema,
  type DatabaseSchema,
} from '../../../schema/database-schema/database-schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
/** The raw pool behind DATABASE_CONNECTION, so the module can close it on shutdown. */
export const DATABASE_POOL = 'DATABASE_POOL';

export type Database = NodePgDatabase<DatabaseSchema>;

const dbLogger = bootstrapLogger.child({ name: 'DatabaseProvider' });

export const databasePoolProvider = {
  provide: DATABASE_POOL,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<Pool> => {
    const pool = new Pool({
      connectionString: configService.getOrThrow<string>(EnvKeys.DATABASE_URL),
      max: 10,
      idleTimeoutMillis: 30_000,
      // `pg` waits forever by default; a database that is not there must fail boot.
      connectionTimeoutMillis: 5_000,
    });

    // An idle client can emit 'error' on its own, e.g. when Postgres restarts.
    // Unlistened, node re-raises it as an uncaught exception and the process
    // exits; the pool already discards the client and reconnects on next acquire.
    pool.on('error', (err) => {
      dbLogger.warn(
        { err },
        'Idle PostgreSQL client error — pool will reconnect',
      );
    });

    // Fail at boot on a bad DATABASE_URL, not on the first request.
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      dbLogger.info('PostgreSQL connectivity verified');
    } finally {
      client.release();
    }

    return pool;
  },
};

export const databaseProvider = {
  provide: DATABASE_CONNECTION,
  inject: [DATABASE_POOL],
  useFactory: (pool: Pool): Database =>
    drizzle(pool, { schema: databaseSchema }),
};
