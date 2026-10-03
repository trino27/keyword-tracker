import { prng } from './prng';

describe('prng', () => {
  it('repeats its sequence for a seed and differs across seeds', () => {
    const a = prng(42);
    const b = prng(42);
    const sequence = [a(), a(), a()];

    expect([b(), b(), b()]).toEqual(sequence);
    expect(prng(43)()).not.toBe(sequence[0]);
  });

  it('stays in [0, 1) and spreads over it', () => {
    const next = prng(7);
    const values = Array.from({ length: 10_000 }, next);

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });
});
