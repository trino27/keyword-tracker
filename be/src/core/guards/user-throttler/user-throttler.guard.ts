import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { IAuthenticatedRequest } from '@core/decorators/current-scope/current-scope.decorator';

/**
 * Throttles a mutating route per signed-in user (PER_MINUTE_THROTTLE).
 *
 * Core, not a module: it reads the scope every authenticated request already carries
 * and knows no domain word, so it has nothing to be a client's or a page's. It lived
 * under `clients/` and was used from `pages/` as well, which is one module reaching
 * into another for a piece of Nest plumbing neither owns.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const { userScope } = request as IAuthenticatedRequest;
    return Promise.resolve(`user:${userScope?.userId ?? 'anonymous'}`);
  }
}
