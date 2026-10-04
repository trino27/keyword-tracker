import { Injectable } from '@nestjs/common';
import { PositionFillService } from '@modules/pages/services/position-fill/position-fill.service';
import { historyDays } from '@modules/pages/services/capture-schedule/capture-schedule';
import { SimulatedRankProvider } from '@modules/pages/services/rank-providers/simulated-rank-provider/simulated-rank-provider.service';
import { SnapshotWriterService } from '@modules/pages/services/snapshot-writer/snapshot-writer.service';

export interface IPositionFill {
  pairs: number;
  days: number;
  rowsAdded: number;
  total: number;
}

/**
 * The seed's side of the fill: every current pair in the database, whoever owns it.
 *
 * It passes the SIMULATION rather than the configured provider, on purpose. Seeding
 * must produce a year or more of past days to reach the brief's snapshot minimum, and
 * only an inventing provider can answer for a day that has already gone; a live rank
 * engine would also charge for a demo database. Which provider serves the API is a
 * separate question, answered by RANK_PROVIDER.
 */
@Injectable()
export class PositionSeedService {
  constructor(
    private readonly snapshots: SnapshotWriterService,
    private readonly fill: PositionFillService,
    private readonly simulation: SimulatedRankProvider,
  ) {}

  async fillForWorker(now: Date): Promise<IPositionFill> {
    const pairs = await this.snapshots.listCurrentPairsForWorker();
    const filled = await this.fill.fill(
      pairs,
      now,
      historyDays(pairs.length),
      this.simulation,
    );
    return { ...filled, total: await this.snapshots.countForWorker() };
  }
}
