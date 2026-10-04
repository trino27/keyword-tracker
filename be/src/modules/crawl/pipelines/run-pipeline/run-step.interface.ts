import type {
  IClaimedRun,
  IRunOutcome,
  IRunTarget,
} from '@modules/clients/interfaces/client-record.interface';
import type { IRunPage } from '@modules/pages/services/crawl-results/crawl-results.service';
import type { IPostSelection } from '../../interfaces/crawled-page.interface';
import type { TSitemapDiscovery } from '../../services/sitemap-discovery/sitemap-discovery.service';
import type { TCrawlStage } from './run-stages';

/** A discovery that found a blog; the failing variant never reaches a later step. */
export type TBlogFound = Extract<TSitemapDiscovery, { ok: true }>;

/**
 * What one run knows as it goes. Every field starts null and is written by the step
 * that learns it; a step reads what the steps before it left, and does nothing when
 * what it needs is still null — which is how a run that found no blog skips straight
 * to being written down, with no flag saying so.
 */
export interface IRunContext {
  readonly run: IClaimedRun;
  readonly signal: AbortSignal;
  /** The client this run is for; null when the run no longer has one. */
  target: IRunTarget | null;
  discovery: TBlogFound | null;
  selection: IPostSelection | null;
  /** The crawled pages with their analysis, ready to be written. */
  pages: IRunPage[] | null;
  /** Set as soon as the run's verdict is known; `persist` writes it, or nothing is. */
  outcome: IRunOutcome | null;
}

/**
 * One stage of a crawl run. Stages are ordered and the order is the algorithm, but it
 * is not a free order: everything that touches the network runs before the one step
 * that opens a transaction, so a slow site never holds a database connection. That is
 * what `opensTransaction` declares and `assertRunPipeline` enforces — the rule that
 * used to be a comment on a 60-line method.
 */
export interface IRunStep {
  readonly name: TCrawlStage;
  /** Exactly one step may open the run's transaction, and it must be the last. */
  readonly opensTransaction?: boolean;
  run(context: IRunContext): Promise<void>;
}
