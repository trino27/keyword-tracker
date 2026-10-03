import { hashSeed } from './hash-seed';

describe('hashSeed', () => {
  it('is stable, unsigned 32-bit and separates url from term', () => {
    const seed = hashSeed('https://a.example/x/', 'seo audit');

    expect(seed).toBe(hashSeed('https://a.example/x/', 'seo audit'));
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(2 ** 32);
    expect(hashSeed('ab', 'c')).not.toBe(hashSeed('a', 'bc'));
  });

  it('matches the FNV-1a reference for the empty pair', () => {
    // FNV-1a("\0") = (0x811c9dc5 ^ 0) * 0x01000193 mod 2^32
    expect(hashSeed('', '')).toBe(0x050c5d1f);
  });
});
