import type {
  TCrawlItemStatus,
  TCrawlRunStatus,
  TCrawlTrigger,
} from '@app/contracts';

export interface IClientRecord {
  id: number;
  name: string;
  websiteUrl: string;
  siteKey: string;
  createdAt: Date;
}

export interface INewClient {
  userId: number;
  name: string;
  websiteUrl: string;
  siteKey: string;
}

export interface ICrawlRunRecord {
  id: number;
  clientId: number;
  status: TCrawlRunStatus;
  trigger: TCrawlTrigger;
  sitemapUrl: string | null;
  selectionReason: string | null;
  pagesFound: number;
  pagesDone: number;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

/** What the clients table shows about a client's runs. */
export interface IClientRunSummary {
  latest: ICrawlRunRecord | null;
  /** Posts of the latest succeeded/partial run — the pages the user sees. */
  currentPageCount: number;
}

export interface ICrawlRunItemRecord {
  sitemapPosition: number;
  url: string;
  status: TCrawlItemStatus;
  reason: string | null;
  httpStatus: number | null;
  pageId: number | null;
}
