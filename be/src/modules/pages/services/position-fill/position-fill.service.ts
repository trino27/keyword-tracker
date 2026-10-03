import { Injectable } from '@nestjs/common';
import type { IPositionFillResult } from '@app/contracts';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { generatePositions } from '../position-generator/generate-positions/generate-positions';
import {
  DAY_MS,
  historyDays,
  latestCapture,
} from '../position-generator/history-days/history-days';
import {
  SnapshotWriterService,
  type ICurrentPairRecord,
  type INewSnapshot,
} from '../snapshot-writer/snapshot-writer.service';

/** Rows per INSERT: well under Postgres' 65 535 bind parameters (4 per row). */
export const SNAPSHOT_BATCH = 5_000;

export interface IFilledPositions {
  pairs: number;
  days: number;
  rowsAdded: number;
}

/**
 * Invented daily positions written for a set of pairs: a full history for a new pair,
 * a fill-up from the last stored day for an existing one — continuing its walk, so a
 * second run on the same day adds nothing.
 *
 * Who the pairs belong to is the caller's decision: the seed fills every user's,
 * `fillForScope` fills only the signed-in user's.
 */
@Injectable()
export class PositionFillService {
  constructor(private readonly snapshots: SnapshotWriterService) {}

  /** The UI's "generate positions" action — the user's own clients and nothing else. */
  async fillForScope(
    scope: IUserScope,
    now: Date = new Date(),
  ): Promise<IPositionFillResult> {
    const pairs = await this.snapshots.listCurrentPairs(scope);
    const filled = await this.fill(pairs, now);
    return { pairs: filled.pairs, added: filled.rowsAdded };
  }

  async fill(
    pairs: ICurrentPairRecord[],
    now: Date,
  ): Promise<IFilledPositions> {
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

    return { pairs: pairs.length, days, rowsAdded };
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
