import { PasswordHasher } from './password-hasher.service';

// N = 2^10 keeps the suite fast; production uses SCRYPT_PARAMS (N = 2^17).
const FAST = {
  N: 2 ** 10,
  r: 8,
  p: 1,
  saltBytes: 16,
  keyLen: 64,
  maxmem: 32 * 1024 * 1024,
};

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('hashes into scrypt$N$r$p$salt$hash with the production parameters by default', async () => {
    const stored = await hasher.hash('correct horse');

    expect(stored).toMatch(
      /^scrypt\$131072\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/,
    );
  });

  it('verifies the right password and refuses a wrong one', async () => {
    const stored = await hasher.hash('correct horse', FAST);

    await expect(hasher.verify('correct horse', stored)).resolves.toBe(true);
    await expect(hasher.verify('wrong horse', stored)).resolves.toBe(false);
  });

  it('reads N, r and p from the stored string, not from the current defaults', async () => {
    const stored = await hasher.hash('correct horse', FAST);

    expect(stored.startsWith('scrypt$1024$8$1$')).toBe(true);
    await expect(hasher.verify('correct horse', stored)).resolves.toBe(true);
  });

  it.each([
    'plain-text',
    'scrypt$abc$8$1$c2FsdA$aGFzaA',
    'scrypt$1024$8$1$c2FsdA',
    'bcrypt$1024$8$1$c2FsdA$aGFzaA',
    '',
  ])(
    'returns false for the malformed string %p without throwing',
    async (stored) => {
      await expect(hasher.verify('anything', stored)).resolves.toBe(false);
    },
  );

  it('produces a different salt every time', async () => {
    const first = await hasher.hash('same', FAST);
    const second = await hasher.hash('same', FAST);

    expect(first).not.toBe(second);
  });
});
