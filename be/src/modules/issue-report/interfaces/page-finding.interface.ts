import type { TSeoIssue } from '@app/contracts';

/** A finding on one current page, as the report's repository reads it. */
export interface IPageFinding {
  issue: TSeoIssue;
  page: { id: number; url: string; title: string | null };
  /**
   * When the device its code belongs to was last measured — the mobile row for a crawl or
   * Lighthouse finding too; null when that device was never measured. Only a Core Web
   * Vitals finding reads it.
   */
  measuredAt: Date | null;
}
