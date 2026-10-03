import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { ISessionUser } from '@app/contracts';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { InvariantViolationException } from '../../exceptions/invariant-violation-exception/invariant-violation.exception';

/** What the session guard attaches to an authenticated request. */
export interface IAuthenticatedRequest {
  userScope?: IUserScope;
  sessionUser?: ISessionUser;
}

/** The signed-in user's scope. Only valid on a guarded (non-@Public) route. */
export const CurrentScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IUserScope => {
    const { userScope } = context
      .switchToHttp()
      .getRequest<IAuthenticatedRequest>();
    if (!userScope) {
      throw new InvariantViolationException(
        '@CurrentScope used on a route the session guard did not authenticate',
      );
    }
    return userScope;
  },
);

/** The signed-in user as the API describes them. Only valid on a guarded route. */
export const CurrentSessionUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ISessionUser => {
    const { sessionUser } = context
      .switchToHttp()
      .getRequest<IAuthenticatedRequest>();
    if (!sessionUser) {
      throw new InvariantViolationException(
        '@CurrentSessionUser used on a route the session guard did not authenticate',
      );
    }
    return sessionUser;
  },
);
