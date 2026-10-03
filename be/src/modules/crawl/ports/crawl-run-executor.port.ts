import type { IClaimedRun } from '@modules/clients/interfaces/client-record.interface';

/** Executes one claimed run to its end; the worker owns claiming, leases and slots. */
export interface ICrawlRunExecutor {
  execute(run: IClaimedRun, signal: AbortSignal): Promise<void>;
}

export const CRAWL_RUN_EXECUTOR = Symbol('CRAWL_RUN_EXECUTOR');
