import { baseline, clampPosition } from './baseline';

const seeds = Array.from({ length: 500 }, (_, i) => i * 7919);

describe('baseline', () => {
  it('puts the strongest keyword at 3–15', () => {
    const values = seeds.map((seed) => baseline(1, seed));

    expect(Math.min(...values)).toBeGreaterThanOrEqual(3);
    expect(Math.max(...values)).toBeLessThanOrEqual(15);
  });

  it('puts a weak keyword (relevance 0.2) around 64–76', () => {
    const values = seeds.map((seed) => baseline(0.2, seed));

    expect(Math.min(...values)).toBeGreaterThanOrEqual(63);
    expect(Math.max(...values)).toBeLessThanOrEqual(77);
  });

  it('is deterministic per seed', () => {
    expect(baseline(0.6, 123)).toBe(baseline(0.6, 123));
  });
});

describe('clampPosition', () => {
  it.each([
    [-4, 1],
    [0.4, 1],
    [50.5, 51],
    [140, 100],
  ])('%d → %d', (input, expected) => {
    expect(clampPosition(input)).toBe(expected);
  });
});
