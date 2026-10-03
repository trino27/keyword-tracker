import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  DATABASE_CONNECTION,
  type Database,
} from '@persistence/connections/postgres/database-provider/database.provider';
import {
  users,
  type UserDbModel,
} from '@persistence/schema/tables/users/users.schema';
import type { IUpsertUser, IUser } from '../../interfaces/user.interface';

const toUser = (row: UserDbModel): IUser => ({
  id: row.id,
  email: row.email,
  passwordHash: row.passwordHash,
  timeZone: row.timeZone,
});

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async findByEmail(email: string): Promise<IUser | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return row ? toUser(row) : null;
  }

  /**
   * Creates the account or refreshes its password and zone. Seed only — there is no
   * sign-up, and the name keeps it out of controllers.
   */
  async upsertByEmailForWorker(account: IUpsertUser): Promise<IUser> {
    const [row] = await this.db
      .insert(users)
      .values(account)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          passwordHash: account.passwordHash,
          timeZone: account.timeZone,
          updatedAt: new Date(),
        },
      })
      .returning();
    return toUser(row);
  }
}
