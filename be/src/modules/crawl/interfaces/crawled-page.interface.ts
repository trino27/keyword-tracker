import type { TCrawlItemStatus } from '@app/contracts';
import type { IParsedPage } from '@modules/page-analysis/interfaces/parsed-page.interface';

/** A post that was fetched and read: what finalize stores and the analysis judges. */
export interface ICrawledPage {
  sitemapPosition: number;
  url: string;
  finalUrl: string;
  redirected: boolean;
  httpStatus: number;
  /** Lower-cased response headers (X-Robots-Tag is a rule input). */
  headers: Record<string, string>;
  /** Time to first byte. */
  responseMs: number;
  htmlBytes: number;
  parsed: IParsedPage;
}

/** One considered sitemap entry, as the run log records it. */
export interface ISelectedItem {
  sitemapPosition: number;
  url: string;
  status: TCrawlItemStatus;
  reason: string | null;
  httpStatus: number | null;
  page: ICrawledPage | null;
}

export interface IPostSelection {
  items: ISelectedItem[];
  pages: ICrawledPage[];
}
