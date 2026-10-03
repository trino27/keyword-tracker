import { createHash, randomBytes } from 'node:crypto';
import { SESSION_TOKEN_BYTES } from '../../constants/session.constant';

/** The opaque value placed in the `sid` cookie. */
export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
}

/**
 * What the database stores instead of the token. A leaked sessions table is then not a
 * list of working cookies; a fast hash is enough because the token is 256 random bits.
 */
export function hashSessionToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}
