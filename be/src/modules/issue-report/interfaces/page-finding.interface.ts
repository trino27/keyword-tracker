import type { TSeoIssue } from '@app/contracts';

/** A finding on one current page, as the report's repository reads it. */
export interface IPageFinding {
  issue: TSeoIssue;
  page: { id: number; url: string; title: string | null };
  /** When the page's speed was measured; null for a crawl finding. */
  measuredAt: Date | null;
}
