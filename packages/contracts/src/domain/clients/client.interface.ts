import type { ICrawlRunSummary } from '../crawl/crawl-run.interface.js';

/** A client as the API describes it. */
export interface IClient {
  id: number;
  name: string;
  websiteUrl: string;
  /** The "same website" identity (parseWebsiteUrl) — lets the UI find a duplicate. */
  siteKey: string;
  /** Pages of the client's current (latest succeeded/partial) run. */
  currentPageCount: number;
  latestRun: ICrawlRunSummary | null;
  createdAt: string;
}

/** `POST /clients` body. */
export interface ICreateClientRequest {
  name: string;
  websiteUrl: string;
}
