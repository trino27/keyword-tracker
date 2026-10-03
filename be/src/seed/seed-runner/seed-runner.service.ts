import { setTimeout as delay } from 'node:timers/promises';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  CURRENT_CRAWL_RUN_STATUSES,
  type TCrawlRunStatus,
} from '@app/contracts';
import { UserAccountsService } from '@modules/auth/services/user-accounts/user-accounts.service';
import { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import { MIN_SNAPSHOTS } from '@modules/pages/services/position-generator/position-generator.constant';
import {
  PositionSeedService,
  type IPositionFill,
} from '../position-seed/position-seed.service';
import {
  SEED_ACCOUNTS,
  SEED_CRAWL_TIMEOUT_MS,
  SEED_POLL_MS,
  SEED_TIME_ZONE,
} from '../seed-accounts.constant';
import { SeedFailedError } from './seed-failed.error';

export interface ISeedOptions {
  password: string;
  /** Skip accounts and crawls; only fill positions (debugging). */
  positionsOnly: boolean;
}

export interface ISeedCrawl {
  client: string;
  /** null: the client already had pages and was not crawled again. */
  runId: number | null;
  status: TCrawlRunStatus | 'skipped';
}

export interface ISeedReport {
  crawls: ISeedCrawl[];
  positions: IPositionFill;
}

export interface ISeedTiming {
  sleep(ms: number): Promise<void>;
  now(): Date;
}

export const SEED_TIMING = Symbol('SEED_TIMING');

const REAL_TIMING: ISeedTiming = {
  sleep: (ms) => delay(ms),
  now: () => new Date(),
};

const current: readonly string[] = CURRENT_CRAWL_RUN_STATUSES;

/**
 * The one seed command (D18), safe to run again at any time: accounts and clients
 * are upserted, a client is crawled only while it has no pages, and positions are
 * filled up to today for every current pair in the database — including clients
 * added through the UI. Nothing is deleted.
 */
@Injectable()
export class SeedRunner {
  private readonly timing: ISeedTiming;

  constructor(
    private readonly accounts: UserAccountsService,
    private readonly runs: ClientCrawlRunsService,
    private readonly positions: PositionSeedService,
    @InjectPinoLogger(SeedRunner.name) private readonly logger: PinoLogger,
    @Optional() @Inject(SEED_TIMING) timing?: ISeedTiming,
  ) {
    this.timing = timing ?? REAL_TIMING;
  }

  async run(options: ISeedOptions): Promise<ISeedReport> {
    const crawls = options.positionsOnly
      ? []
      : await this.seedAccounts(options.password);

    const positions = await this.positions.fillForWorker(this.timing.now());
    this.logger.info(positions, 'Positions filled');
    if (positions.total < MIN_SNAPSHOTS) {
      throw new SeedFailedError(
        `Only ${positions.total} rank snapshots exist; at least ${MIN_SNAPSHOTS} are required.`,
      );
    }
    return { crawls, positions };
  }

  private async seedAccounts(password: string): Promise<ISeedCrawl[]> {
    const crawls: ISeedCrawl[] = [];
    for (const account of SEED_ACCOUNTS) {
      const user = await this.accounts.upsertUserForWorker({
        email: account.email,
        password,
        timeZone: SEED_TIME_ZONE,
      });
      const client = await this.runs.upsertClientForWorker({
        userId: user.id,
        ...account.client,
      });
      crawls.push(await this.crawlIfEmpty(client.id, client.name));
    }
    return crawls;
  }

  private async crawlIfEmpty(
    clientId: number,
    name: string,
  ): Promise<ISeedCrawl> {
    const state = await this.runs.getSeedStateForWorker(clientId);
    if (state.hasCurrentRun) {
      this.logger.info(
        { client: name },
        'Client already crawled; not crawling again',
      );
      return { client: name, runId: null, status: 'skipped' };
    }
    const runId =
      state.activeRunId ?? (await this.runs.enqueueForWorker(clientId, 'seed'));
    this.logger.info({ client: name, runId }, 'Waiting for the crawl');
    const status = await this.waitFor(runId, name);
    return { client: name, runId, status };
  }

  /** Polls the run until it ends; the worker — in this process or the API's — runs it. */
  private async waitFor(runId: number, name: string): Promise<TCrawlRunStatus> {
    const deadline = this.timing.now().getTime() + SEED_CRAWL_TIMEOUT_MS;
    for (;;) {
      const run = await this.runs.getRunStatusForWorker(runId);
      if (run && current.includes(run.status)) {
        if (run.status === 'partial')
          this.logger.warn(
            { client: name, runId },
            'Crawl found fewer than 15 posts',
          );
        return run.status;
      }
      if (!run || run.status === 'failed') {
        throw new SeedFailedError(
          `The crawl of ${name} failed (${run?.errorCode ?? 'run missing'}).`,
        );
      }
      if (this.timing.now().getTime() > deadline) {
        throw new SeedFailedError(
          `The crawl of ${name} did not finish in time.`,
        );
      }
      await this.timing.sleep(SEED_POLL_MS);
    }
  }
}
