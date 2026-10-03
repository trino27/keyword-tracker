import {
  BASELINE_BEST,
  BASELINE_JITTER,
  BASELINE_SPREAD,
  MAX_POSITION,
  MIN_POSITION,
} from '../position-generator.constant';
import { prng } from '../prng/prng';

export const clampPosition = (position: number) =>
  Math.min(MAX_POSITION, Math.max(MIN_POSITION, Math.round(position)));

/**
 * Where a pair's walk settles: a page ranks best for the keyword it is most about.
 * relevance 1 → 3–15; relevance 0.2 → about 64–76.
 */
export function baseline(relevance: number, seed: number): number {
  const u = prng(seed)();
  return clampPosition(
    BASELINE_BEST +
      (1 - relevance) ** 1.5 * BASELINE_SPREAD +
      u * BASELINE_JITTER,
  );
}
