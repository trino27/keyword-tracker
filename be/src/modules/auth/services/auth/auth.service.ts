import { Injectable } from '@nestjs/common';
import type { ISessionUser } from '@app/contracts';
import {
  SESSION_TOUCH_INTERVAL_MS,
  SESSION_TTL_MS,
} from '../../constants/session.constant';
import { InvalidCredentialsException } from '../../exceptions/auth.exceptions';
import { SessionsRepository } from '../../repositories/sessions/sessions.repository';
import { UsersRepository } from '../../repositories/users/users.repository';
import { PasswordHasher } from '../password-hasher/password-hasher.service';
import {
  generateSessionToken,
  hashSessionToken,
} from '../session-token/session-token';

export interface ISignInResult {
  user: ISessionUser;
  token: string;
  expiresAt: Date;
}

export interface IResolvedSession {
  user: ISessionUser;
  expiresAt: Date;
  /** True when this request pushed the expiry forward and the cookie must be re-issued. */
  slid: boolean;
}

export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

@Injectable()
export class AuthService {
  /**
   * A real scrypt hash nobody's password matches. Verifying an unknown email against it
   * costs the same as verifying a known one, so response time does not reveal whether
   * an account exists.
   */
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly users: UsersRepository,
    private readonly sessions: SessionsRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async signIn(email: string, password: string): Promise<ISignInResult> {
    const user = await this.users.findByEmail(normalizeEmail(email));
    const stored = user?.passwordHash ?? (await this.getDummyHash());
    const valid = await this.hasher.verify(password, stored);
    if (!user || !valid) throw new InvalidCredentialsException();

    const now = new Date();
    await this.sessions.deleteExpired(now);

    const token = generateSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await this.sessions.create({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });

    return {
      user: { id: user.id, email: user.email, timeZone: user.timeZone },
      token,
      expiresAt,
    };
  }

  async signOut(token: string): Promise<void> {
    await this.sessions.deleteByTokenHash(hashSessionToken(token));
  }

  /** The user behind a cookie, sliding the expiry at most once per touch interval. */
  async resolveSession(token: string): Promise<IResolvedSession | null> {
    const now = new Date();
    const session = await this.sessions.findLiveByTokenHash(
      hashSessionToken(token),
      now,
    );
    if (!session) return null;

    const sinceSeen = now.getTime() - session.lastSeenAt.getTime();
    if (sinceSeen < SESSION_TOUCH_INTERVAL_MS) {
      return { user: session.user, expiresAt: session.expiresAt, slid: false };
    }

    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await this.sessions.touch(session.id, expiresAt, now);
    return { user: session.user, expiresAt, slid: true };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(generateSessionToken());
    return this.dummyHash;
  }
}
