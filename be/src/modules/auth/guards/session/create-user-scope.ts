import type { ISessionUser } from '@app/contracts';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';

/**
 * The ONLY place an IUserScope is made — from a session the guard has just verified.
 * ESLint bans `as IUserScope` in every other file, so a scope cannot be forged from a
 * request parameter.
 */
export function createUserScope(user: ISessionUser): IUserScope {
  return Object.freeze({
    userId: user.id,
    timeZone: user.timeZone,
  }) as IUserScope;
}
