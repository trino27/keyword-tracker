const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * 32-bit FNV-1a of `url \0 term`: the identity of a pair's walk. Keyed by URL and term
 * rather than database ids, so a re-seeded database regenerates the same history.
 */
export function hashSeed(url: string, term: string): number {
  let hash = FNV_OFFSET;
  for (const byte of Buffer.from(`${url}\u0000${term}`, 'utf8')) {
    hash ^= byte;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}
