import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import {
  DATABASE_POOL,
  databasePoolProvider,
  databaseProvider,
} from './database-provider/database.provider';

@Global()
@Module({
  providers: [databasePoolProvider, databaseProvider],
  exports: [databaseProvider],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /** Drain the pool so in-flight queries finish and Postgres sees clean disconnects. */
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
