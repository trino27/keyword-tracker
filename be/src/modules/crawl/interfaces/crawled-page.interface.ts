import type { TCrawlItemStatus } from '@app/contracts';
import type {
  IParsedPage,
  IPreviewImage,
} from '@modules/page-analysis/interfaces/parsed-page.interface';
import type { IRobotsRules } from '@modules/page-analysis/interfaces/robots-rules.interface';

/** A post that was fetched and read: what finalize stores and the analysis judges. */
export interface ICrawledPage {
  sitemapPosition: number;
  url: string;
  finalUrl: string;
  redirected: boolean;
  /** Each redirect followed on the way, with its status. */
  redirects: { url: string; status: number }[];
  /** The run's robots.txt; the checks ask it about Googlebot. */
  robots: IRobotsRules;
  httpStatus: number;
  /** Lower-cased response headers (X-Robots-Tag is a rule input). */
  headers: Record<string, string>;
  /** When the response arrived. */
  fetchedAt: Date;
  /** Time to first byte. */
  responseMs: number;
  htmlBytes: number;
  parsed: IParsedPage;
  /** The page's own image, measured from the file; null when it names none or may not be fetched. */
  previewImage: IPreviewImage | null;
}

/** One considered sitemap entry, as the run log records it. */
export interface ISelectedItem {
  sitemapPosition: number;
  url: string;
  status: TCrawlItemStatus;
  reason: string | null;
  httpStatus: number | null;
  /**
   * Skipped because its content is drawn by JavaScript: the HTML is an empty shell. A
   * structured fact, so the site check counts the flag and never parses `reason`.
   */
  clientRendered: boolean;
  page: ICrawledPage | null;
}

export interface IPostSelection {
  items: ISelectedItem[];
  pages: ICrawledPage[];
}
