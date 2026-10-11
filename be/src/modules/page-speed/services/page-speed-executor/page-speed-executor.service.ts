import { Inject, Injectable } from '@nestjs/common';
import type { TPageSpeedErrorCode } from '@app/contracts';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  PAGE_SPEED_SETTINGS,
  type IPageSpeedSettings,
} from '@infrastructure/config/page-speed-settings/page-speed-settings';
import { PageSpeedRuntimeState } from '@infrastructure/config/page-speed-settings/page-speed-runtime-state';
import type {
  IClaimedPageSpeed,
  TPageSpeedJobWrite,
  IPageSpeedMeasurementWrite,
  TPageSpeedCompletion,
} from '@modules/pages/interfaces/page-speed.interface';
import { PageSpeedResultsService } from '@modules/pages/services/page-speed-results/page-speed-results.service';
import { PAGE_SPEED_MAX_ATTEMPTS } from '@shared/page-speed-queue/page-speed-queue.constant';
import {
  classifyPsiResponse,
  type TPsiCallResult,
} from '../classify-psi-response/classify-psi-response';
import type { IExtractedImageDelivery } from '../extract-image-delivery/extract-image-delivery';
import type { ILighthouseRecord } from '../extract-lighthouse/extract-lighthouse';
import type {
  IExtractedDiagnostics,
  IExtractedMeasurement,
} from '../extract-measurement/extract-measurement';
import { PsiClient } from '../psi-client/psi-client';
import { PageSpeedRateLimiter } from '../rate-limiter/page-speed-rate-limiter';
import { retryDelayMs } from '../retry-delay/retry-delay';
import { speedIssuesOf } from '../speed-issues/speed-issues-of';

/**
 * One claimed row from request to write (plan §9):
 *
 * - measured → the measurement and its findings, in one transaction;
 * - transient → back in the queue after 1, 4, 16, 64 minutes; the 5th time, failed;
 * - 429 → every slot pauses, the row is given back with its attempt;
 * - key refused → the queue halts until restart, the row is given back, every screen
 *   says so;
 * - permanent → failed, with the reason the screen will show.
 *
 * Every failure path writes job columns only: the last good measurement survives. The key
 * is never logged and never stored — `last_error` is a catalogue code, not a message.
 */
@Injectable()
export class PageSpeedExecutorService {
  /**
   * Lighthouse audits the catalogue does not know, already reported. A stale catalogue
   * shows on every page measured; one line per audit per process says so without
   * drowning the log (lighthouse-checks D13).
   */
  private readonly unknownAuditsReported = new Set<string>();

  constructor(
    private readonly results: PageSpeedResultsService,
    private readonly psi: PsiClient,
    private readonly limiter: PageSpeedRateLimiter,
    private readonly runtime: PageSpeedRuntimeState,
    @Inject(PAGE_SPEED_SETTINGS) private readonly settings: IPageSpeedSettings,
    @InjectPinoLogger(PageSpeedExecutorService.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(claim: IClaimedPageSpeed, signal: AbortSignal): Promise<void> {
    const apiKey = this.settings.apiKey;
    // The worker never starts without a key; a claim without one is given straight back.
    if (apiKey === null) {
      await this.results.releaseForWorker(claim, new Date());
      return;
    }
    const result = await this.psi.runPagespeed(
      claim.url,
      claim.strategy,
      apiKey,
      signal,
    );
    if (signal.aborted) {
      // Shutting down: not the page's failure, so it keeps its attempt.
      await this.results.releaseForWorker(claim, new Date());
      return;
    }
    try {
      await this.settle(claim, result);
    } catch (err: unknown) {
      await this.settleUnexpected(claim, err);
    }
  }

  private reportUnknownAudits(lighthouse: ILighthouseRecord | null): void {
    for (const audit of lighthouse?.unknownAudits ?? []) {
      if (this.unknownAuditsReported.has(audit)) continue;
      this.unknownAuditsReported.add(audit);
      this.logger.warn(
        { audit },
        'Lighthouse scored an audit the catalogue does not know; re-record the PageSpeed fixtures and update the catalogue',
      );
    }
  }

  /**
   * A bug, or the database failing mid-write: the row is not left `running` until its
   * lease expires and it is filed as ABANDONED. It is counted as a failed attempt and
   * tried again later — never released, or a bug would retry forever for free.
   */
  private async settleUnexpected(
    claim: IClaimedPageSpeed,
    err: unknown,
  ): Promise<void> {
    this.logger.error(
      { err, pageId: claim.pageId, attempt: claim.attempt },
      'PageSpeed measurement failed unexpectedly',
    );
    await this.results.recordFailureForWorker(
      claim,
      failedAttemptWrite(claim, 'PSI_UNAVAILABLE', new Date()),
    );
  }

  private async settle(
    claim: IClaimedPageSpeed,
    result: TPsiCallResult,
  ): Promise<void> {
    const now = new Date();
    const outcome = classifyPsiResponse(result, now.getTime());
    const where = {
      pageId: claim.pageId,
      strategy: claim.strategy,
      attempt: claim.attempt,
    };

    switch (outcome.kind) {
      case 'measured': {
        const completion = completionOf(claim, outcome, now);
        const written = await this.results.completeForWorker(claim, completion);
        if (completion.strategy === 'mobile')
          this.reportUnknownAudits(outcome.lighthouse);
        const findings =
          completion.strategy === 'mobile'
            ? [...completion.speedFindings, ...completion.lighthouseFindings]
            : completion.speedFindings;
        this.logger.info(
          { ...where, findings: findings.map(({ code }) => code), written },
          'Page measured',
        );
        return;
      }
      case 'transient': {
        const write = failedAttemptWrite(claim, outcome.error, now);
        const final = write.status === 'failed';
        await this.results.recordFailureForWorker(claim, write);
        this.logger.warn(
          { ...where, final },
          final
            ? 'PageSpeed did not answer; giving up on the page'
            : 'PageSpeed did not answer; retrying later',
        );
        return;
      }
      case 'rateLimited': {
        this.limiter.pause(outcome.pauseMs);
        await this.results.releaseForWorker(
          claim,
          new Date(now.getTime() + outcome.pauseMs),
        );
        this.logger.warn(
          { ...where, pauseMs: outcome.pauseMs },
          'PageSpeed rate limit reached; pausing every slot',
        );
        return;
      }
      case 'keyRejected': {
        const first = !this.limiter.isHalted;
        this.limiter.halt();
        this.runtime.markKeyRejected();
        await this.results.releaseForWorker(claim, now);
        if (first)
          this.logger.error(
            'Google rejected PAGESPEED_API_KEY; measurements are paused until the key is fixed and the API restarted',
          );
        return;
      }
      case 'permanent': {
        await this.results.recordFailureForWorker(claim, {
          status: 'failed',
          lastError: outcome.error,
        });
        this.logger.info(
          { ...where, error: outcome.error },
          'PageSpeed could not measure the page',
        );
        return;
      }
    }
  }
}

/**
 * A failed attempt that is not the page's verdict: back in the queue after the backoff
 * (1, 4, 16, 64 minutes), or — the attempts spent — failed with the same reason.
 */
function failedAttemptWrite(
  claim: IClaimedPageSpeed,
  lastError: TPageSpeedErrorCode,
  now: Date,
): TPageSpeedJobWrite {
  return claim.attempt >= PAGE_SPEED_MAX_ATTEMPTS
    ? { status: 'failed', lastError }
    : {
        status: 'queued',
        lastError,
        nextAttemptAt: new Date(now.getTime() + retryDelayMs(claim.attempt)),
      };
}

/**
 * What a measured answer writes for the claimed device. Lighthouse speaks for mobile alone
 * (lighthouse-checks D16): a desktop completion carries no Lighthouse record and no
 * Lighthouse findings, whatever the answer held, so it cannot touch mobile's.
 */
function completionOf(
  claim: IClaimedPageSpeed,
  outcome: {
    measurement: IExtractedMeasurement;
    diagnostics: IExtractedDiagnostics;
    lighthouse: ILighthouseRecord | null;
    imageDelivery: IExtractedImageDelivery | null;
  },
  measuredAt: Date,
): TPageSpeedCompletion {
  if (claim.strategy === 'desktop')
    return {
      strategy: 'desktop',
      measurement: {
        ...toWrite({ ...outcome, lighthouse: null }, measuredAt),
        lighthouseJudged: null,
        lighthouseNotApplicable: null,
        lighthouseFailed: null,
        seoScore: null,
        accessibilityScore: null,
      },
      speedFindings: speedIssuesOf({
        strategy: 'desktop',
        measurement: outcome.measurement,
      }),
    };
  return {
    strategy: 'mobile',
    measurement: toWrite(outcome, measuredAt),
    speedFindings: speedIssuesOf({
      strategy: 'mobile',
      measurement: outcome.measurement,
      imageDelivery: outcome.imageDelivery,
    }),
    lighthouseFindings: outcome.lighthouse?.findings ?? [],
  };
}

function toWrite(
  {
    measurement,
    diagnostics,
    lighthouse,
  }: {
    measurement: IExtractedMeasurement;
    diagnostics: IExtractedDiagnostics;
    lighthouse: ILighthouseRecord | null;
  },
  measuredAt: Date,
): IPageSpeedMeasurementWrite {
  const { shares } = diagnostics;
  return {
    lcpMs: measurement.lcp.value,
    lcpSource: measurement.lcp.source,
    inpMs: measurement.inp?.value ?? null,
    inpSource: measurement.inp?.source ?? null,
    cls: measurement.cls.value,
    clsSource: measurement.cls.source,
    performanceScore: measurement.performanceScore,
    measuredAt,
    ttfbMs: diagnostics.ttfb?.value ?? null,
    ttfbSource: diagnostics.ttfb?.source ?? null,
    lcpGoodShare: shares.lcp?.good ?? null,
    lcpPoorShare: shares.lcp?.poor ?? null,
    inpGoodShare: shares.inp?.good ?? null,
    inpPoorShare: shares.inp?.poor ?? null,
    clsGoodShare: shares.cls?.good ?? null,
    clsPoorShare: shares.cls?.poor ?? null,
    ttfbGoodShare: shares.ttfb?.good ?? null,
    ttfbPoorShare: shares.ttfb?.poor ?? null,
    lcpBreakdown: diagnostics.lcpBreakdown,
    lighthouseJudged: lighthouse?.judged ?? null,
    lighthouseNotApplicable: lighthouse?.notApplicable ?? null,
    lighthouseFailed: lighthouse?.findings.length ?? null,
    seoScore: lighthouse?.seoScore ?? null,
    accessibilityScore: lighthouse?.accessibilityScore ?? null,
  };
}
