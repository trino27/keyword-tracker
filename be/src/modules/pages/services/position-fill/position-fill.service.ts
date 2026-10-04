import { Inject, Injectable } from '@nestjs/common';
import { MAX_HISTORY_DAYS, type IPositionFillResult } from '@app/contracts';
import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import {
  RANK_POSITION_PROVIDER,
  type IRankObservation,
  type IRankPositionProvider,
  type IRankRequest,
  type IRankTarget,
} from '../../ports/rank-position-provider.port';
import { DAY_MS, latestCapture } from '../capture-schedule/capture-schedule';
import { SnapshotWriterService } from '../snapshot-writer/snapshot-writer.service';

/** Rows per INSERT: well under Postgres' 65 535 bind parameters (4 per row). */
export const SNAPSHOT_BATCH = 5_000;

/**
 * Pairs handed to the provider in one call. A real engine wants a batch — one HTTP
 * round trip for many keywords — while memory wants a bound on how many observations
 * are held before they are written. This is where the two meet.
 */
export const REQUEST_BATCH = 100;

export interface IFilledPositions {
  pairs: number;
  days: number;
  rowsAdded: number;
}

/**
 * Daily positions written for a set of pairs: where each pair's history stops decides
 * what is asked for, so a second run on the same day adds nothing.
 *
 * This service owns the SCHEDULE and the WRITE; where a position comes from is the
 * provider's business (`ports/rank-position-provider.port.ts`). It therefore makes no
 * assumption that the provider can answer for a past day — it asks for the whole
 * missing window and writes whatever comes back, which for a live rank engine is just
 * the latest instant.
 *
 * Who the pairs belong to, how far back to go and WHICH provider are all the caller's
 * decision: `fillForScope` fills the signed-in user's pairs with the configured
 * provider and only as far back as the UI can ask to see, while the seed passes the
 * simulation explicitly.
 *
 * A provider call is never made inside an open transaction — it may be a network
 * request. Each batch of observations is written in its own transaction instead: the
 * insert is idempotent and every pair resumes from its last stored row, so a fill that
 * fails halfway is COMPLETED by the next run, not corrupted by it.
 */
@Injectable()
export class PositionFillService {
  constructor(
    private readonly snapshots: SnapshotWriterService,
    private readonly transactions: TransactionRunner,
    @Inject(RANK_POSITION_PROVIDER)
    private readonly provider: IRankPositionProvider,
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
    const targets = await this.snapshots.listCurrentPairs(scope);
    const filled = await this.fill(
      targets,
      now,
      MAX_HISTORY_DAYS,
      this.provider,
    );
    return { pairs: filled.pairs, added: filled.rowsAdded };
  }

  async fill(
    targets: IRankTarget[],
    now: Date,
    days: number,
    provider: IRankPositionProvider,
  ): Promise<IFilledPositions> {
    const to = latestCapture(now);
    const from = new Date(to.getTime() - (days - 1) * DAY_MS);
    const requests = targets
      .map((target) => this.requestFor(target, from, to))
      .filter((request): request is IRankRequest => request !== null);

    let rowsAdded = 0;
    for (let start = 0; start < requests.length; start += REQUEST_BATCH) {
      const observations = await provider.capture(
        requests.slice(start, start + REQUEST_BATCH),
      );
      rowsAdded += await this.write(observations);
    }

    return { pairs: targets.length, days, rowsAdded };
  }

  /** Null when the pair already has every capture up to `to`. */
  private requestFor(
    target: IRankTarget,
    from: Date,
    to: Date,
  ): IRankRequest | null {
    const start =
      target.lastCapturedAt === null
        ? from
        : new Date(target.lastCapturedAt.getTime() + DAY_MS);
    return start.getTime() > to.getTime() ? null : { target, from: start, to };
  }

  private write(observations: IRankObservation[]): Promise<number> {
    if (observations.length === 0) return Promise.resolve(0);
    return this.transactions.run(async (tx) => {
      let added = 0;
      for (
        let start = 0;
        start < observations.length;
        start += SNAPSHOT_BATCH
      ) {
        added += await this.flush(
          observations.slice(start, start + SNAPSHOT_BATCH),
          tx,
        );
      }
      return added;
    });
  }

  private flush(batch: IRankObservation[], tx: Transaction): Promise<number> {
    return this.snapshots.insertManyForWorker(batch, tx);
  }
}
