declare const userScopeBrand: unique symbol;

/**
 * Proof that a request belongs to a signed-in user — the first argument of every
 * repository method over that user's data, so a missing ownership check is a missing
 * argument and does not compile.
 *
 * Branded: an object literal cannot pass for it. Only the session guard creates one
 * (`create-user-scope.ts`); ESLint bans `as IUserScope` everywhere else.
 */
export interface IUserScope {
  readonly userId: number;
  readonly timeZone: string;
  readonly [userScopeBrand]: true;
}
