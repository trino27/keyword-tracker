import { Injectable } from '@nestjs/common';
import {
  SnapshotWriterService,
  type ICurrentPairRecord,
  type INewSnapshot,
} from '@modules/pages/services/snapshot-writer/snapshot-writer.service';
import { generatePositions } from '../position-generator/generate-positions/generate-positions';
import {
  DAY_MS,
  historyDays,
  latestCapture,
} from '../position-generator/history-days/history-days';

/** Rows per INSERT: well under Postgres' 65 535 bind parameters (4 per row). */
export const SNAPSHOT_BATCH = 5_000;

export interface IPositionFill {
  pairs: number;
  days: number;
  rowsAdded: number;
  total: number;
}

/**
 * Daily positions for every current pair, up to the latest capture instant: a full
 * history for a new pair, a fill-up from the last stored day for an existing one —
 * continuing its walk, so a re-run on the same day adds nothing.
 */
@Injectable()
export class PositionSeedService {
  constructor(private readonly snapshots: SnapshotWriterService) {}

  async fillForWorker(now: Date): Promise<IPositionFill> {
    const pairs = await this.snapshots.listCurrentPairsForWorker();
    const days = historyDays(pairs.length);
    const end = latestCapture(now);

    let batch: INewSnapshot[] = [];
    let rowsAdded = 0;
    for (const pair of pairs) {
      for (const position of this.positionsFor(pair, end, days)) {
        batch.push({
          pageId: pair.pageId,
          keywordId: pair.keywordId,
          ...position,
        });
        if (batch.length >= SNAPSHOT_BATCH) {
          rowsAdded += await this.snapshots.insertManyForWorker(batch);
          batch = [];
        }
      }
    }
    rowsAdded += await this.snapshots.insertManyForWorker(batch);

    return {
      pairs: pairs.length,
      days,
      rowsAdded,
      total: await this.snapshots.countForWorker(),
    };
  }

  private positionsFor(pair: ICurrentPairRecord, end: Date, days: number) {
    if (pair.lastCapturedAt === null || pair.lastPosition === null) {
      return generatePositions(
        pair,
        new Date(end.getTime() - (days - 1) * DAY_MS),
        days,
      );
    }
    const from = new Date(pair.lastCapturedAt.getTime() + DAY_MS);
    const missing = Math.round((end.getTime() - from.getTime()) / DAY_MS) + 1;
    return missing > 0
      ? generatePositions(pair, from, missing, pair.lastPosition)
      : [];
  }
}
