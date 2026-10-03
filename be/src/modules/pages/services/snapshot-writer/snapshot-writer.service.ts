import { Injectable } from '@nestjs/common';
import type { IUserScope } from '@shared/user-scope/user-scope.interface';
import {
  RankSnapshotsRepository,
  type ICurrentPairRecord,
  type INewSnapshot,
} from '../../repositories/rank-snapshots/rank-snapshots.repository';

export type { ICurrentPairRecord, INewSnapshot };

/**
 * Rank snapshots as their producer sees them — today the seed, later a rank provider.
 * Unscoped (`…ForWorker`): positions are written for every user's pairs.
 */
@Injectable()
export class SnapshotWriterService {
  constructor(private readonly snapshots: RankSnapshotsRepository) {}

  listCurrentPairsForWorker(): Promise<ICurrentPairRecord[]> {
    return this.snapshots.listCurrentPairsForWorker();
  }

  /** One user's pairs — what the "generate positions" action is allowed to touch. */
  listCurrentPairs(scope: IUserScope): Promise<ICurrentPairRecord[]> {
    return this.snapshots.listCurrentPairs(scope);
  }

  /** Returns how many rows were new; existing (pair, instant) rows are kept. */
  insertManyForWorker(rows: INewSnapshot[]): Promise<number> {
    return this.snapshots.insertManyForWorker(rows);
  }

  countForWorker(): Promise<number> {
    return this.snapshots.countForWorker();
  }
}
