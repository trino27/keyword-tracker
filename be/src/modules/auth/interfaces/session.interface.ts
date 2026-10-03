import type { IUser } from './user.interface';

export interface ICreateSession {
  userId: number;
  tokenHash: Buffer;
  expiresAt: Date;
}

/** A live session together with the user it belongs to. */
export interface ILiveSession {
  id: number;
  expiresAt: Date;
  lastSeenAt: Date;
  user: Pick<IUser, 'id' | 'email' | 'timeZone'>;
}
