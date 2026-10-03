/** A user as the auth module works with it — never sent to a client as is. */
export interface IUser {
  id: number;
  email: string;
  passwordHash: string;
  timeZone: string;
}

/** What the seed writes to create or refresh an account. */
export interface IUpsertUser {
  email: string;
  passwordHash: string;
  timeZone: string;
}
