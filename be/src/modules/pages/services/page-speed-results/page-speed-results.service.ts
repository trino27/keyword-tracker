import { Injectable } from '@nestjs/common';
import type { TLighthouseSeoIssue, TPageSpeedSeoIssue } from '@app/contracts';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type {
  IClaimedPageSpeed,
  IPageSpeedJobWrite,
  IPageSpeedMeasurementWrite,
} from '../../interfaces/page-speed.interface';
import { PageSpeedRepository } from '../../repositories/page-speed/page-speed.repository';
import { SeoIssuesRepository } from '../../repositories/seo-issues/seo-issues.repository';

/**
 * What the PageSpeed worker may do to the pages module's tables, and nothing more: claim,
 * abandon, complete, fail, release. There is no method here that writes `pages` — speed
 * never moves a page's score or its place in the list.
 */
@Injectable()
export class PageSpeedResultsService {
  constructor(
    private readonly pageSpeed: PageSpeedRepository,
    private readonly seoIssues: SeoIssuesRepository,
    private readonly transactions: TransactionRunner,
  ) {}

  claimNextForWorker(leaseMs: number): Promise<IClaimedPageSpeed | null> {
    return this.pageSpeed.claimNextForWorker(leaseMs);
  }

  failAbandonedForWorker(): Promise<number> {
    return this.pageSpeed.failAbandonedForWorker();
  }

  /**
   * The measurement and both kinds of its findings — Core Web Vitals and Lighthouse — in
   * ONE transaction, under the fence: a stale attempt writes none of them, and a reader
   * never sees new figures beside old findings.
   */
  completeForWorker(
    claim: IClaimedPageSpeed,
    measurement: IPageSpeedMeasurementWrite,
    findings: TPageSpeedSeoIssue[],
    lighthouseFindings: TLighthouseSeoIssue[],
  ): Promise<boolean> {
    return this.transactions.run(async (tx) => {
      const owned = await this.pageSpeed.completeForWorker(
        tx,
        claim.pageId,
        claim.attempt,
        measurement,
      );
      if (!owned) return false;
      await this.seoIssues.replacePageSpeedFindingsForWorker(
        tx,
        claim.pageId,
        findings.map((finding) => ({ ...finding, pageId: claim.pageId })),
      );
      await this.seoIssues.replaceLighthouseFindingsForWorker(
        tx,
        claim.pageId,
        lighthouseFindings.map((finding) => ({
          ...finding,
          pageId: claim.pageId,
        })),
      );
      return true;
    });
  }

  recordFailureForWorker(
    claim: IClaimedPageSpeed,
    write: IPageSpeedJobWrite,
  ): Promise<boolean> {
    return this.pageSpeed.recordFailureForWorker(
      claim.pageId,
      claim.attempt,
      write,
    );
  }

  releaseForWorker(
    claim: IClaimedPageSpeed,
    notBefore: Date,
  ): Promise<boolean> {
    return this.pageSpeed.releaseForWorker(
      claim.pageId,
      claim.attempt,
      notBefore,
    );
  }
}
