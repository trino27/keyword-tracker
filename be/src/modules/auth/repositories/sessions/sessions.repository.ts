import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, lte } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import { sessions } from '@persistence/schema/tables/sessions/sessions.schema';
import { users } from '@persistence/schema/tables/users/users.schema';
import type {
  ICreateSession,
  ILiveSession,
} from '../../interfaces/session.interface';

@Injectable()
export class SessionsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(session: ICreateSession): Promise<void> {
    await this.db.insert(sessions).values(session);
  }

  /** The session behind a cookie, with its user — null when unknown or expired. */
  async findLiveByTokenHash(
    tokenHash: Buffer,
    now: Date,
  ): Promise<ILiveSession | null> {
    const [row] = await this.db
      .select({
        id: sessions.id,
        expiresAt: sessions.expiresAt,
        lastSeenAt: sessions.lastSeenAt,
        user: { id: users.id, email: users.email, timeZone: users.timeZone },
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)),
      )
      .limit(1);
    return row ?? null;
  }

  /** Slides the expiry forward and records when the session was last used. */
  async touch(id: number, expiresAt: Date, now: Date): Promise<void> {
    await this.db
      .update(sessions)
      .set({ expiresAt, lastSeenAt: now })
      .where(eq(sessions.id, id));
  }

  async deleteByTokenHash(tokenHash: Buffer): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  async deleteExpired(now: Date): Promise<void> {
    await this.db.delete(sessions).where(lte(sessions.expiresAt, now));
  }
}
