import { Injectable } from '@nestjs/common';
import type {
  IRankObservation,
  IRankPositionProvider,
  IRankRequest,
} from '../../../ports/rank-position-provider.port';
import { DAY_MS } from '../../capture-schedule/capture-schedule';
import { generatePositions } from '../../position-generator/generate-positions/generate-positions';

export const SIMULATED_PROVIDER_ID = 'simulation';

/**
 * Invented positions: the mean-reverting walk in `position-generator/`, behind the port.
 *
 * It covers any window it is given, past included, which is what lets the seed reach the
 * brief's 50,000 snapshots. The walk is deterministic in (url, term, day), so a fill that
 * stops halfway and runs again produces exactly the series one run would have.
 */
@Injectable()
export class SimulatedRankProvider implements IRankPositionProvider {
  readonly id = SIMULATED_PROVIDER_ID;

  capture(requests: IRankRequest[]): Promise<IRankObservation[]> {
    const observations: IRankObservation[] = [];
    for (const { target, from, to } of requests) {
      const days = Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1;
      if (days <= 0) continue;
      for (const position of generatePositions(
        target,
        from,
        days,
        target.lastPosition ?? undefined,
      )) {
        observations.push({
          pageId: target.pageId,
          keywordId: target.keywordId,
          ...position,
        });
      }
    }
    return Promise.resolve(observations);
  }
}
