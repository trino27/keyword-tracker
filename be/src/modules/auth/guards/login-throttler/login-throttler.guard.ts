import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface ILoginRequestLike {
  ip?: string;
  body?: { email?: unknown };
}

/** Throttles login per IP + lower-cased email (PER_MINUTE_THROTTLE). */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const { ip, body } = request as ILoginRequestLike;
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    return Promise.resolve(`${ip ?? 'unknown'}:${email}`);
  }
}
