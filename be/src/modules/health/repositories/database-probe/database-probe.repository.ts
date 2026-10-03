import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';

@Injectable()
export class DatabaseProbeRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** True when the database answers a trivial query; false on any failure. */
  async isReachable(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }
}
