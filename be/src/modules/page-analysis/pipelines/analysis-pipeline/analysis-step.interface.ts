import type { ISelectedKeyword } from '../../services/keyword-extraction/select-keywords/select-keywords';
import type { ISeoRuleInput } from '../../services/seo-rules/seo-rule.interface';
import type { ISeoEvaluation } from '../../services/seo-rules/seo-rules.registry';

/** One fetched page, as the analysis needs it. */
export interface IAnalysisInput extends ISeoRuleInput {
  /**
   * Time to first byte. Stored on the page as a fact of the crawl; no rule reads it,
   * because a measurement of the crawler is not a property of the page.
   */
  responseMs: number;
}

/**
 * What the analysis of one run knows while it works: the pages, and the two verdicts
 * being assembled about them — one entry per page, by the same index.
 *
 * Both are arrays over the run rather than values returned per page, because the
 * analysis is a run-level act: keywords already need every page at once (IDF), and the
 * checks that come next — duplicate titles across the site, keyword cannibalisation,
 * orphan pages — need the same. A step that judges the run writes into the same
 * `evaluations` the page rules filled, so one page's score stays one number with one
 * denominator however many steps contributed to it.
 */
export interface IAnalysisContext {
  readonly pages: readonly IAnalysisInput[];
  readonly siteKey: string;
  keywords: ISelectedKeyword[][];
  evaluations: ISeoEvaluation[];
}

/**
 * One step of the analysis, named so the pipeline reads as what it does and a test or
 * an experiment can replace a step by name. A step is pure but for the context.
 */
export interface IAnalysisStep {
  readonly name: string;
  run(context: IAnalysisContext): void;
}
