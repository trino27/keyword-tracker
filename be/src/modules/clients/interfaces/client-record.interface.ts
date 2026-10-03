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

/** A run the worker has just claimed. `attempts` is the fencing token of this execution. */
export interface IClaimedRun {
  id: number;
  clientId: number;
  attempts: number;
}

/** Where a run crawls. */
export interface IRunTarget {
  clientId: number;
  websiteUrl: string;
  siteKey: string;
}

export interface IRunDiscovery {
  sitemapUrl: string;
  selectionReason: string;
  pagesFound: number;
}

export interface IRunOutcome {
  status: 'succeeded' | 'partial' | 'failed';
  pagesDone: number;
  errorCode: string | null;
  errorMessage: string | null;
}

/** What the seed needs to know before it enqueues a crawl. */
export interface IClientSeedState {
  /** A succeeded or partial run exists: the client has pages. */
  hasCurrentRun: boolean;
  activeRunId: number | null;
}

export interface IRunStatus {
  status: TCrawlRunStatus;
  errorCode: string | null;
}
