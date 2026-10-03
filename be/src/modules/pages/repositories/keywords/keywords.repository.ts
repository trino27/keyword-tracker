import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { keywords } from '@persistence/schema/tables/keywords/keywords.schema';

@Injectable()
export class KeywordsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Returns the id of every term, inserting the new ones. The no-op update makes
   * RETURNING include terms that already existed — and takes their row lock, so two
   * concurrent runs inserting the same new term cannot both miss it.
   */
  async upsertTermsForWorker(
    tx: Transaction,
    terms: string[],
  ): Promise<Map<string, number>> {
    const unique = [...new Set(terms)].sort();
    if (unique.length === 0) return new Map();
    const rows = await tx
      .insert(keywords)
      .values(unique.map((term) => ({ term })))
      .onConflictDoUpdate({
        target: keywords.term,
        set: { term: sql`excluded.term` },
      })
      .returning({ id: keywords.id, term: keywords.term });
    return new Map(rows.map(({ id, term }) => [term, id]));
  }
}
