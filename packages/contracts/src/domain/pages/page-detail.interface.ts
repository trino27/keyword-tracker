import type { ICrawlRunSummary } from '../crawl/crawl-run.interface.js';
import type { TSeoIssue } from '../seo/seo-issue.interface.js';
import type { IBestPosition } from './best-position.interface.js';
import type { IKeywordPosition } from './keyword-position.interface.js';

export interface IPageDetail {
  page: {
    id: number;
    url: string;
    finalUrl: string;
    title: string | null;
    metaDescription: string | null;
    h1: string | null;
    lang: string | null;
    wordCount: number;
    httpStatus: number;
    /**
     * Time to first byte of the crawler's single fetch. A fact of the crawl, never a
     * verdict, and never a field measurement of the page's visitors.
     */
    responseMs: number;
    /** ISO-8601 UTC instant of the last fetch. */
    crawledAt: string;
  };
  client: { id: number; name: string; websiteUrl: string };
  /** By relevance, strongest first. */
  keywords: IKeywordPosition[];
  bestPosition: IBestPosition | null;
  /** Catalogue order: errors, then warnings, then notices. */
  issues: TSeoIssue[];
  /** The client's latest run, whatever its status. */
  lastCrawl: ICrawlRunSummary | null;
}
