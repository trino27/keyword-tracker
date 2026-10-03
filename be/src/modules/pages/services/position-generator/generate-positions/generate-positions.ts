import {
  JUMP_MAX,
  JUMP_MIN,
  JUMP_PROBABILITY,
  NOISE,
  REVERT,
} from '../position-generator.constant';
import { baseline, clampPosition } from '../baseline/baseline';
import { hashSeed } from '../hash-seed/hash-seed';
import { DAY_MS } from '../history-days/history-days';
import { prng } from '../prng/prng';

export interface IPairWalk {
  url: string;
  term: string;
  relevance: number;
}

export interface IGeneratedPosition {
  capturedAt: Date;
  position: number;
}

/**
 * Daily positions for one pair: a mean-reverting random walk around its baseline.
 *
 * Each day's randomness depends only on the pair and that day — never on how many
 * days were generated before it in this call — so filling a→b, then b+1→c from b's
 * last position, produces exactly the series a→c would have. The seed's fill-up of
 * existing pairs relies on it.
 *
 * `from` is the first capture instant; `start` is the position the day before it
 * (the baseline for a pair with no history).
 */
export function generatePositions(
  pair: IPairWalk,
  from: Date,
  days: number,
  start?: number,
): IGeneratedPosition[] {
  const seed = hashSeed(pair.url, pair.term);
  const base = baseline(pair.relevance, seed);
  const positions: IGeneratedPosition[] = [];
  let position = start ?? base;
  for (let day = 0; day < days; day += 1) {
    const capturedAt = new Date(from.getTime() + day * DAY_MS);
    const random = prng(seed ^ Math.floor(capturedAt.getTime() / DAY_MS));
    const noise = (random() * 2 - 1) * NOISE;
    const jump =
      random() < JUMP_PROBABILITY
        ? (random() < 0.5 ? -1 : 1) *
          (JUMP_MIN + random() * (JUMP_MAX - JUMP_MIN))
        : 0;
    position = clampPosition(
      position + REVERT * (base - position) + noise + jump,
    );
    positions.push({ capturedAt, position });
  }
  return positions;
}
