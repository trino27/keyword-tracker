import { Injectable } from '@nestjs/common';
import { PositionFillService } from '@modules/pages/services/position-fill/position-fill.service';
import { SnapshotWriterService } from '@modules/pages/services/snapshot-writer/snapshot-writer.service';

export interface IPositionFill {
  pairs: number;
  days: number;
  rowsAdded: number;
  total: number;
}

/**
 * The seed's side of the fill: every current pair in the database, whoever owns it.
 * The generating itself lives in `PositionFillService`, which the API's
 * "generate positions" action calls with one user's pairs instead.
 */
@Injectable()
export class PositionSeedService {
  constructor(
    private readonly snapshots: SnapshotWriterService,
    private readonly fill: PositionFillService,
  ) {}

  async fillForWorker(now: Date): Promise<IPositionFill> {
    const pairs = await this.snapshots.listCurrentPairsForWorker();
    const filled = await this.fill.fill(pairs, now);
    return { ...filled, total: await this.snapshots.countForWorker() };
  }
}
