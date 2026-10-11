import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { EnvKeys } from '@infrastructure/config/env-keys.constant';
import {
  PAGE_SPEED_SETTINGS,
  type IPageSpeedSettings,
} from '@infrastructure/config/page-speed-settings/page-speed-settings';
import { runWithTraceId } from '@infrastructure/observability/trace/trace-context';
import { PageSpeedResultsService } from '@modules/pages/services/page-speed-results/page-speed-results.service';
import { PgNotificationListener } from '@persistence/connections/postgres/notification-listener/pg-notification-listener';
import { PAGE_SPEED_QUEUED_CHANNEL } from '@shared/page-speed-queue/page-speed-queue.constant';
import {
  PAGE_SPEED_ABANDON_SWEEP_MS,
  PAGE_SPEED_LEASE_MS,
  PAGE_SPEED_POLL_INTERVAL_MS,
  PAGE_SPEED_WORKER_SLOTS,
} from '../../constants/page-speed-worker.constant';
import { PageSpeedExecutorService } from '../../services/page-speed-executor/page-speed-executor.service';
import { PageSpeedRateLimiter } from '../../services/rate-limiter/page-speed-rate-limiter';

/**
 * The PageSpeed queue's consumer: a fixed number of slots, each taking its turn from the
 * rate limiter, then claiming one row and measuring it. It starts only in a process with
 * CRAWL_WORKER_ENABLED=true AND a key (plan D21): tests force the flag off and drive
 * `runOnce()` themselves, and without a key there is nothing it could do but fail.
 *
 * No heartbeat, unlike the crawl: one attempt is one bounded request, and the lease is
 * longer than its timeout. A crashed process needs no cleanup — the lease expires.
 */
@Injectable()
export class PageSpeedWorker
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private running = false;
  private loops: Promise<void>[] = [];
  private readonly sleepers = new Set<() => void>();
  private stopping = new AbortController();
  /** When abandoned rows were last swept; the sweep is an UPDATE, not worth every poll. */
  private lastSweepAt = 0;

  constructor(
    @InjectPinoLogger(PageSpeedWorker.name) private readonly logger: PinoLogger,
    private readonly config: ConfigService,
    @Inject(PAGE_SPEED_SETTINGS) private readonly settings: IPageSpeedSettings,
    private readonly results: PageSpeedResultsService,
    private readonly executor: PageSpeedExecutorService,
    private readonly limiter: PageSpeedRateLimiter,
    private readonly listener: PgNotificationListener,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>(EnvKeys.CRAWL_WORKER_ENABLED) !== 'true')
      return;
    if (this.settings.apiKey === null) {
      this.logger.info(
        'PageSpeed not configured (no PAGESPEED_API_KEY); pages stay queued',
      );
      return;
    }
    await this.start();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.stop();
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.stopping = new AbortController();
    await this.listener.listen(PAGE_SPEED_QUEUED_CHANNEL, () => this.wakeAll());
    this.loops = Array.from({ length: PAGE_SPEED_WORKER_SLOTS }, () =>
      this.loop(),
    );
    this.logger.info(
      { slots: PAGE_SPEED_WORKER_SLOTS },
      'PageSpeed worker started',
    );
  }

  /**
   * Stops claiming, aborts the requests in flight — their rows are given back — and waits
   * for every slot to leave `runOnce()` before the database module ends the pool.
   */
  async stop(): Promise<void> {
    if (!this.running) return;
    this.running = false;
    this.stopping.abort();
    this.wakeAll();
    const loops = this.loops;
    this.loops = [];
    await Promise.all(loops);
    await this.listener.close();
    this.logger.info('PageSpeed worker stopped');
  }

  /**
   * Takes a turn, then claims and measures at most one row; true when one was measured.
   * False when the queue is empty, halted by a refused key, or the worker is stopping.
   */
  runOnce(): Promise<boolean> {
    return runWithTraceId(undefined, async () => {
      if (!(await this.limiter.acquire(this.stopping.signal))) return false;
      if (Date.now() - this.lastSweepAt >= PAGE_SPEED_ABANDON_SWEEP_MS) {
        this.lastSweepAt = Date.now();
        await this.results.failAbandonedForWorker();
      }
      const claim = await this.results.claimNextForWorker(PAGE_SPEED_LEASE_MS);
      if (!claim) return false;
      await this.executor.execute(claim, this.stopping.signal);
      return true;
    });
  }

  private async loop(): Promise<void> {
    while (this.running && !this.limiter.isHalted) {
      let measured = false;
      try {
        measured = await this.runOnce();
      } catch (err: unknown) {
        this.logger.error({ err }, 'PageSpeed worker iteration failed');
      }
      if (!measured && this.running && !this.limiter.isHalted)
        await this.sleep();
    }
  }

  private sleep(): Promise<void> {
    return new Promise((resolve) => {
      const wake = () => {
        clearTimeout(timer);
        this.sleepers.delete(wake);
        resolve();
      };
      const timer = setTimeout(wake, PAGE_SPEED_POLL_INTERVAL_MS);
      this.sleepers.add(wake);
    });
  }

  private wakeAll(): void {
    for (const wake of [...this.sleepers]) wake();
  }
}
