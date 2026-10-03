import { Injectable } from '@nestjs/common';
import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';
import {
  SCRYPT_PARAMS,
  type IScryptParams,
} from '../../constants/session.constant';

const PREFIX = 'scrypt';

function derive(
  password: string,
  salt: Buffer,
  keyLen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLen, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/**
 * Password hashing with node's scrypt — no native dependency in the image.
 *
 * Stored as `scrypt$N$r$p$salt$hash` (base64url), so the parameters travel with the
 * hash: they can be raised later and old hashes still verify.
 */
@Injectable()
export class PasswordHasher {
  async hash(
    password: string,
    params: IScryptParams = SCRYPT_PARAMS,
  ): Promise<string> {
    const salt = randomBytes(params.saltBytes);
    const key = await derive(password, salt, params.keyLen, {
      N: params.N,
      r: params.r,
      p: params.p,
      maxmem: params.maxmem,
    });
    return [
      PREFIX,
      params.N,
      params.r,
      params.p,
      salt.toString('base64url'),
      key.toString('base64url'),
    ].join('$');
  }

  /** False for a wrong password AND for a malformed stored string — never throws. */
  async verify(password: string, stored: string): Promise<boolean> {
    const parsed = parseStored(stored);
    if (!parsed) return false;

    const { N, r, p, salt, expected } = parsed;
    try {
      const actual = await derive(password, salt, expected.length, {
        N,
        r,
        p,
        maxmem: Math.max(SCRYPT_PARAMS.maxmem, 256 * N * r),
      });
      return timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
}

function parseStored(stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) return null;

  const [N, r, p] = parts.slice(1, 4).map(Number);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return null;

  const salt = Buffer.from(parts[4], 'base64url');
  const expected = Buffer.from(parts[5], 'base64url');
  if (salt.length === 0 || expected.length === 0) return null;

  return { N, r, p, salt, expected };
}
