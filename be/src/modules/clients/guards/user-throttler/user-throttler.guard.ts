import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { IAuthenticatedRequest } from '@core/decorators/current-scope/current-scope.decorator';

/** Throttles a mutating route per signed-in user (PER_MINUTE_THROTTLE). */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const { userScope } = request as IAuthenticatedRequest;
    return Promise.resolve(`user:${userScope?.userId ?? 'anonymous'}`);
  }
}
