import { generateSessionToken, hashSessionToken } from './session-token';

describe('session token', () => {
  it('is 32 random bytes, base64url-encoded', () => {
    const token = generateSessionToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(generateSessionToken()).not.toBe(token);
  });

  it('hashes with sha256 into 32 bytes, deterministically', () => {
    const token = generateSessionToken();

    expect(hashSessionToken(token)).toHaveLength(32);
    expect(hashSessionToken(token).equals(hashSessionToken(token))).toBe(true);
    expect(hashSessionToken(token).equals(hashSessionToken(`${token}x`))).toBe(
      false,
    );
  });
});
