import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { clients } from '@persistence/schema/tables/clients/clients.schema';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import type {
  IClientRecord,
  INewClient,
} from '../../interfaces/client-record.interface';

const columns = {
  id: clients.id,
  name: clients.name,
  websiteUrl: clients.websiteUrl,
  siteKey: clients.siteKey,
  createdAt: clients.createdAt,
};

@Injectable()
export class ClientsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async insert(tx: Transaction, client: INewClient): Promise<IClientRecord> {
    const [row] = await tx.insert(clients).values(client).returning(columns);
    return row;
  }

  /** The seed's idempotent create: one row per (user, site key), the name refreshed. */
  async upsertForWorker(client: INewClient): Promise<IClientRecord> {
    const [row] = await this.db
      .insert(clients)
      .values(client)
      .onConflictDoUpdate({
        target: [clients.userId, clients.siteKey],
        set: { name: sql`excluded.name` },
      })
      .returning(columns);
    return row;
  }

  /** The client if it exists AND belongs to the scope's user; null otherwise. */
  async findOwned(
    scope: IUserScope,
    clientId: number,
  ): Promise<IClientRecord | null> {
    const [row] = await this.db
      .select(columns)
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, scope.userId)))
      .limit(1);
    return row ?? null;
  }

  /**
   * Deletes the client if the scope's user owns it; false for missing and foreign alike.
   * Its runs, run log, pages, keyword pairs, issues and snapshots go with it (cascades);
   * shared keyword terms stay.
   */
  async deleteOwned(scope: IUserScope, clientId: number): Promise<boolean> {
    const deleted = await this.db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, scope.userId)))
      .returning({ id: clients.id });
    return deleted.length > 0;
  }

  listOwned(scope: IUserScope): Promise<IClientRecord[]> {
    return this.db
      .select(columns)
      .from(clients)
      .where(eq(clients.userId, scope.userId))
      .orderBy(asc(clients.name), asc(clients.id));
  }
}
