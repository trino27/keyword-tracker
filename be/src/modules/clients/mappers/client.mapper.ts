import type { IClient, ICrawlRunSummary } from '@app/contracts';
import type {
  IClientRecord,
  IClientRunSummary,
  ICrawlRunRecord,
} from '../interfaces/client-record.interface';

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

export const toCrawlRunSummary = (run: ICrawlRunRecord): ICrawlRunSummary => ({
  id: run.id,
  status: run.status,
  trigger: run.trigger,
  pagesFound: run.pagesFound,
  pagesDone: run.pagesDone,
  errorCode: run.errorCode,
  errorMessage: run.errorMessage,
  createdAt: run.createdAt.toISOString(),
  startedAt: iso(run.startedAt),
  finishedAt: iso(run.finishedAt),
});

export const toClient = (
  client: IClientRecord,
  summary: IClientRunSummary,
): IClient => ({
  id: client.id,
  name: client.name,
  websiteUrl: client.websiteUrl,
  siteKey: client.siteKey,
  currentPageCount: summary.currentPageCount,
  latestRun: summary.latest ? toCrawlRunSummary(summary.latest) : null,
  createdAt: client.createdAt.toISOString(),
});
