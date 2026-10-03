import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EnvKeys } from '@infrastructure/config/env-keys.constant';
import type { IClaimedRun } from '@modules/clients/interfaces/client-record.interface';
import { ClientCrawlRunsService } from '@modules/clients/services/client-crawl-runs/client-crawl-runs.service';
import { PgNotificationListener } from '@persistence/connections/postgres/notification-listener/pg-notification-listener';
import { CRAWL_QUEUED_CHANNEL } from '@shared/crawl-queue/crawl-queue.constant';
import {
  CRAWL_HEARTBEAT_MS,
  CRAWL_LEASE_MS,
  CRAWL_POLL_INTERVAL_MS,
  CRAWL_WORKER_SLOTS,
} from '../../constants/crawl-worker.constant';
import {
  CRAWL_RUN_EXECUTOR,
  type ICrawlRunExecutor,
} from '../../ports/crawl-run-executor.port';

/**
 * The crawl queue's consumer: a fixed number of slots, each claiming one run at a
 * time from crawl_runs and executing it under a lease the heartbeat keeps renewing.
 *
 * Idle slots sleep until the poll interval ends or a NOTIFY arrives. A crashed process
 * needs no cleanup: its leases expire and any worker reclaims the runs. A long-running
 * loop is neither a controller nor a schedule, hence `workers/`.
 */
@Injectable()
export class CrawlWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private running = false;
  private loops: Promise<void>[] = [];
  private readonly sleepers = new Set<() => void>();
  private readonly inFlight = new Set<AbortController>();

  constructor(
    @InjectPinoLogger(CrawlWorker.name) private readonly logger: PinoLogger,
    private readonly config: ConfigService,
    private readonly runs: ClientCrawlRunsService,
    @Inject(CRAWL_RUN_EXECUTOR) private readonly executor: ICrawlRunExecutor,
    private readonly listener: PgNotificationListener,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>(EnvKeys.CRAWL_WORKER_ENABLED) !== 'true')
      return;
    await this.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.listener.listen(CRAWL_QUEUED_CHANNEL, () => this.wakeAll());
    this.loops = Array.from({ length: CRAWL_WORKER_SLOTS }, () => this.loop());
    this.logger.info({ slots: CRAWL_WORKER_SLOTS }, 'Crawl worker started');
  }

  /** Stops claiming, aborts what is in flight; the leases then expire and are reclaimed. */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    this.wakeAll();
    for (const controller of this.inFlight) controller.abort();
    await this.listener.close();
    this.logger.info('Crawl worker stopped');
  }

  /**
   * Claims and executes at most one run; true when one was executed. The loop is built
   * on it, and tests and the seed call it directly.
   */
  async runOnce(): Promise<boolean> {
    await this.runs.failAbandonedForWorker();
    const run = await this.runs.claimNextForWorker(CRAWL_LEASE_MS);
    if (!run) return false;
    await this.execute(run);
    return true;
  }

  private async loop(): Promise<void> {
    while (this.running) {
      let executed = false;
      try {
        executed = await this.runOnce();
      } catch (err: unknown) {
        this.logger.error({ err }, 'Crawl worker iteration failed');
      }
      if (!executed && this.running) await this.sleep();
    }
  }

  private async execute(run: IClaimedRun): Promise<void> {
    const controller = new AbortController();
    this.inFlight.add(controller);
    const heartbeat = setInterval(() => {
      this.runs
        .renewLeaseForWorker(run.id, run.attempts, CRAWL_LEASE_MS)
        .then((stillOwned) => {
          if (!stillOwned) {
            this.logger.warn(
              { runId: run.id, attempt: run.attempts },
              'Lost the crawl run to a newer attempt — aborting',
            );
            controller.abort();
          }
        })
        .catch((err: unknown) =>
          this.logger.warn({ err, runId: run.id }, 'Lease renewal failed'),
        );
    }, CRAWL_HEARTBEAT_MS);

    try {
      await this.executor.execute(run, controller.signal);
    } finally {
      clearInterval(heartbeat);
      this.inFlight.delete(controller);
    }
  }

  private sleep(): Promise<void> {
    return new Promise((resolve) => {
      const wake = () => {
        clearTimeout(timer);
        this.sleepers.delete(wake);
        resolve();
      };
      const timer = setTimeout(wake, CRAWL_POLL_INTERVAL_MS);
      this.sleepers.add(wake);
    });
  }

  private wakeAll(): void {
    for (const wake of [...this.sleepers]) wake();
  }
}
