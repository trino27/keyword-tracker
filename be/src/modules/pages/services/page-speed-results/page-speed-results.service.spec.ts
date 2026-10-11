import type { Transaction } from '@persistence/connections/postgres/types/transaction.type';
import type { TransactionRunner } from '@persistence/connections/postgres/transaction-runner/transaction-runner';
import type { IPageSpeedMeasurementWrite } from '../../interfaces/page-speed.interface';
import type { PageSpeedRepository } from '../../repositories/page-speed/page-speed.repository';
import type { SeoIssuesRepository } from '../../repositories/seo-issues/seo-issues.repository';
import { PageSpeedResultsService } from './page-speed-results.service';

const tx = { tx: true } as unknown as Transaction;
const claim = { pageId: 7, attempt: 2, url: 'https://example.com/a/' };
const measurement: IPageSpeedMeasurementWrite = {
  lcpMs: 3100,
  lcpSource: 'url',
  inpMs: null,
  inpSource: null,
  cls: 0.02,
  clsSource: 'lab',
  performanceScore: 70,
  measuredAt: new Date('2026-10-10T12:00:00Z'),
  ttfbMs: null,
  ttfbSource: null,
  lcpGoodShare: null,
  lcpPoorShare: null,
  inpGoodShare: null,
  inpPoorShare: null,
  clsGoodShare: null,
  clsPoorShare: null,
  ttfbGoodShare: null,
  ttfbPoorShare: null,
  lcpBreakdown: null,
  lighthouseJudged: ['LH_IMAGE_ALT', 'LH_CANONICAL'],
  lighthouseNotApplicable: [],
  lighthouseFailed: 1,
  seoScore: 90,
  accessibilityScore: 88,
};

const setup = (owned: boolean) => {
  const pageSpeed = {
    completeForWorker: jest.fn().mockResolvedValue(owned),
  };
  const seoIssues = {
    replacePageSpeedFindingsForWorker: jest.fn().mockResolvedValue(undefined),
    replaceLighthouseFindingsForWorker: jest.fn().mockResolvedValue(undefined),
  };
  const transactions = {
    run: (work: (t: Transaction) => Promise<unknown>) => work(tx),
  };
  const service = new PageSpeedResultsService(
    pageSpeed as unknown as PageSpeedRepository,
    seoIssues as unknown as SeoIssuesRepository,
    transactions as unknown as TransactionRunner,
  );
  return { service, pageSpeed, seoIssues };
};

describe('PageSpeedResultsService.completeForWorker', () => {
  it('writes the measurement, its speed findings and its Lighthouse findings in one transaction', async () => {
    const { service, pageSpeed, seoIssues } = setup(true);

    const written = await service.completeForWorker(
      claim,
      measurement,
      [
        {
          code: 'CWV_LCP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 3100, max: 2500, source: 'url' },
        },
      ],
      [{ code: 'LH_IMAGE_ALT', severity: 'warning', details: {} }],
    );

    expect(seoIssues.replaceLighthouseFindingsForWorker).toHaveBeenCalledWith(
      tx,
      7,
      [{ pageId: 7, code: 'LH_IMAGE_ALT', severity: 'warning', details: {} }],
    );

    expect(written).toBe(true);
    expect(pageSpeed.completeForWorker).toHaveBeenCalledWith(
      tx,
      7,
      2,
      measurement,
    );
    expect(seoIssues.replacePageSpeedFindingsForWorker).toHaveBeenCalledWith(
      tx,
      7,
      [
        {
          pageId: 7,
          code: 'CWV_LCP_NEEDS_IMPROVEMENT',
          severity: 'notice',
          details: { value: 3100, max: 2500, source: 'url' },
        },
      ],
    );
  });

  /** A stale attempt must not replace the findings the newer attempt is about to write. */
  it('writes no findings when the attempt no longer owns the row', async () => {
    const { service, seoIssues } = setup(false);

    expect(await service.completeForWorker(claim, measurement, [], [])).toBe(
      false,
    );
    expect(seoIssues.replacePageSpeedFindingsForWorker).not.toHaveBeenCalled();
    expect(seoIssues.replaceLighthouseFindingsForWorker).not.toHaveBeenCalled();
  });
});
