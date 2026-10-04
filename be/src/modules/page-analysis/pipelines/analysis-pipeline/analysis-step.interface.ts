import type { IPipelineStep } from '../pipeline';
import type { ISelectedKeyword } from '../../services/keyword-extraction/select-keywords/select-keywords';
import type { ICheckInput } from '../../services/checks/check.interface';
import type { ISeoEvaluation } from '../../services/checks/checks.registry';

/** One fetched page, as the analysis needs it. */
export interface IAnalysisInput extends ICheckInput {
  /**
   * Time to first byte. Stored on the page as a fact of the crawl; no check reads it,
   * because a measurement of the crawler is not a property of the page.
   */
  responseMs: number;
}

/**
 * What the analysis of one run knows while it works: the pages, and the two verdicts
 * being assembled about them — one entry per page, by the same index.
 *
 * Both are arrays over the run rather than values returned per page, because the
 * analysis is a run-level act: keywords need every page at once (IDF), and so do the
 * checks that compare a page with its siblings — duplicate titles, cannibalisation. Any
 * step that judges the run writes into the same `evaluations`, so one page's score stays
 * one number with one denominator however many steps contributed to it.
 */
export interface IAnalysisContext {
  readonly pages: readonly IAnalysisInput[];
  readonly siteKey: string;
  keywords: ISelectedKeyword[][];
  evaluations: ISeoEvaluation[];
}

/**
 * One step of the analysis. The contract is `IPipelineStep`, shared with keyword
 * extraction; this name is what the steps and their tests read as.
 */
export type IAnalysisStep = IPipelineStep<IAnalysisContext>;
