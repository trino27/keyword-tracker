import { Injectable } from '@nestjs/common';
import { MAX_HISTORY_DAYS, type IPositionFillResult } from '@app/contracts';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import { generatePositions } from '../position-generator/generate-positions/generate-positions';
import {
  DAY_MS,
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
 * Both who the pairs belong to and how far back to go are the caller's decision: the
 * seed fills every user's pairs over the span its snapshot target needs, `fillForScope`
 * fills only the signed-in user's and only as far back as the UI can ask to see.
 *
 * One fill is one transaction. The batches below are a bind-parameter limit, not a
 * commit boundary — a fill that fails halfway must leave no partial history behind.
 */
@Injectable()
export class PositionFillService {
  constructor(
    private readonly snapshots: SnapshotWriterService,
    private readonly transactions: TransactionRunner,
  ) {}

  /**
   * The UI's "generate positions" action — the user's own clients and nothing else,
   * over `MAX_HISTORY_DAYS`. A longer span is not a kindness: no range the history
   * screen offers reaches past it, so the extra rows could never be displayed.
   */
  async fillForScope(
    scope: IUserScope,
    now: Date = new Date(),
  ): Promise<IPositionFillResult> {
    const pairs = await this.snapshots.listCurrentPairs(scope);
    const filled = await this.fill(pairs, now, MAX_HISTORY_DAYS);
    return { pairs: filled.pairs, added: filled.rowsAdded };
  }

  async fill(
    pairs: ICurrentPairRecord[],
    now: Date,
    days: number,
  ): Promise<IFilledPositions> {
    const end = latestCapture(now);

    const rowsAdded = await this.transactions.run(async (tx) => {
      let batch: INewSnapshot[] = [];
      let added = 0;
      for (const pair of pairs) {
        for (const position of this.positionsFor(pair, end, days)) {
          batch.push({
            pageId: pair.pageId,
            keywordId: pair.keywordId,
            ...position,
          });
          if (batch.length >= SNAPSHOT_BATCH) {
            added += await this.flush(batch, tx);
            batch = [];
          }
        }
      }
      return added + (await this.flush(batch, tx));
    });

    return { pairs: pairs.length, days, rowsAdded };
  }

  private flush(batch: INewSnapshot[], tx: Transaction): Promise<number> {
    return this.snapshots.insertManyForWorker(batch, tx);
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
