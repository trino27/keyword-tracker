import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { DatabaseSchema } from '../../../schema/database-schema/database-schema';

/** What `db.transaction(async (tx) => …)` hands its callback; repositories accept it optionally. */
export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  DatabaseSchema,
  ExtractTablesWithRelations<DatabaseSchema>
>;
