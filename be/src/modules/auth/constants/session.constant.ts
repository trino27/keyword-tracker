export const SESSION_COOKIE_NAME = 'sid';

/** Sliding lifetime: a session unused for this long expires. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The expiry slides at most this often. Without it every request would be a write to
 * the sessions table; with it, an active user costs one UPDATE a minute.
 */
export const SESSION_TOUCH_INTERVAL_MS = 60 * 1000;

export const SESSION_TOKEN_BYTES = 32;

export interface IScryptParams {
  N: number;
  r: number;
  p: number;
  saltBytes: number;
  keyLen: number;
  maxmem: number;
}

/**
 * OWASP-listed scrypt parameters. `maxmem` is NOT optional: N·r·128 = 128 MiB is
 * above Node's 32 MiB default, and `scrypt` throws "memory limit exceeded" without it.
 */
export const SCRYPT_PARAMS: IScryptParams = {
  N: 2 ** 17,
  r: 8,
  p: 1,
  saltBytes: 16,
  keyLen: 64,
  maxmem: 256 * 1024 * 1024,
};
