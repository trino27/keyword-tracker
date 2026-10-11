import { Injectable } from '@nestjs/common';
import { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type {
  IClaimedPageSpeed,
  TPageSpeedJobWrite,
  TPageSpeedCompletion,
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
   * The measurement and its findings in ONE transaction, under the fence: a stale attempt
   * writes none of them, and a reader never sees new figures beside old findings. The
   * device's own Core Web Vitals findings are replaced; Lighthouse's only by a mobile
   * measurement, the one answer that carries them (lighthouse-checks D16).
   */
  completeForWorker(
    claim: IClaimedPageSpeed,
    completion: TPageSpeedCompletion,
  ): Promise<boolean> {
    const { pageId, attempt } = claim;
    const addressed = <T>(findings: T[]) =>
      findings.map((finding) => ({ ...finding, pageId }));
    return this.transactions.run(async (tx) => {
      const owned = await this.pageSpeed.completeForWorker(
        tx,
        pageId,
        completion.strategy,
        attempt,
        completion.measurement,
      );
      if (!owned) return false;
      if (completion.strategy === 'desktop') {
        await this.seoIssues.replacePageSpeedFindingsForWorker(
          tx,
          pageId,
          'desktop',
          addressed(completion.speedFindings),
        );
        return true;
      }
      await this.seoIssues.replacePageSpeedFindingsForWorker(
        tx,
        pageId,
        'mobile',
        addressed(completion.speedFindings),
      );
      await this.seoIssues.replaceLighthouseFindingsForWorker(
        tx,
        pageId,
        addressed(completion.lighthouseFindings),
      );
      return true;
    });
  }

  recordFailureForWorker(
    claim: IClaimedPageSpeed,
    write: TPageSpeedJobWrite,
  ): Promise<boolean> {
    return this.pageSpeed.recordFailureForWorker(
      claim.pageId,
      claim.strategy,
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
      claim.strategy,
      claim.attempt,
      notBefore,
    );
  }
}
