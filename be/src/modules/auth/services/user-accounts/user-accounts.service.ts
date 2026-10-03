import { Injectable } from '@nestjs/common';
import { isTimeZone } from '@app/contracts';
import { InvariantViolationException } from '@core/exceptions/invariant-violation-exception/invariant-violation.exception';
import type { IUser } from '../../interfaces/user.interface';
import { UsersRepository } from '../../repositories/users/users.repository';
import { normalizeEmail } from '../auth/auth.service';
import { PasswordHasher } from '../password-hasher/password-hasher.service';

export interface IUserAccount {
  email: string;
  password: string;
  timeZone: string;
}

/** Creates or refreshes accounts. There is no sign-up: only the seed calls this. */
@Injectable()
export class UserAccountsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async upsertUserForWorker(account: IUserAccount): Promise<IUser> {
    if (!isTimeZone(account.timeZone)) {
      throw new InvariantViolationException(
        `Unknown time zone "${account.timeZone}"`,
      );
    }
    return this.users.upsertByEmailForWorker({
      email: normalizeEmail(account.email),
      passwordHash: await this.hasher.hash(account.password),
      timeZone: account.timeZone,
    });
  }
}
