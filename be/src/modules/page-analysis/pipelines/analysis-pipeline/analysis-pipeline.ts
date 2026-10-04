import { evaluateChecks } from '../../services/checks/checks.registry';
import { extractKeywords } from '../../services/keyword-extraction/extract-keywords/extract-keywords';
import { runPipeline } from '../pipeline';
import type {
  IAnalysisContext,
  IAnalysisInput,
  IAnalysisStep,
} from './analysis-step.interface';

/** Which keywords each page of the run targets; needs every page at once (IDF). */
export const KEYWORDS_STEP: IAnalysisStep = {
  name: 'keywords',
  async run(context) {
    context.keywords = await extractKeywords(context.pages, context.siteKey);
  },
};

/**
 * What is wrong with each page: one pass over the catalogue per page, covering both the
 * checks a page answers about itself and the ones that compare it with the rest of the
 * crawl. One step rather than two, because they fill ONE evaluation per page — split in
 * two, the second had to rebuild what the first left and sort it back into catalogue
 * order.
 *
 * It reads `context.keywords`, which is why `keywords` runs first.
 */
export const CHECKS_STEP: IAnalysisStep = {
  name: 'checks',
  run(context) {
    context.evaluations = evaluateChecks({
      pages: context.pages,
      keywords: context.keywords,
    });
  },
};

/**
 * Everything the analysis says about one crawl, as the ordered list of what it does.
 *
 * The step is the unit of extension for a KIND of work, not for a single check: a new
 * check is an entry in `CHECKS`, while a step is what the next network-bound pass
 * (Lighthouse, broken links) will be — it fetches, so it cannot sit inside a pass that
 * is arithmetic over already-fetched pages. Such a step extends the same `evaluations`
 * rather than reporting beside them, which is how a page would otherwise end up with two
 * scores and two denominators.
 *
 * The order here is load-bearing exactly once: `checks` reads what `keywords` left.
 */
export const ANALYSIS_PIPELINE: readonly IAnalysisStep[] = [
  KEYWORDS_STEP,
  CHECKS_STEP,
];

/** A context no step has written to yet. */
export function emptyAnalysisContext(
  pages: readonly IAnalysisInput[],
  siteKey: string,
): IAnalysisContext {
  return { pages, siteKey, keywords: [], evaluations: [] };
}

/** Runs the steps in order over one context and hands it back filled. */
export function runAnalysisPipeline(
  context: IAnalysisContext,
  pipeline: readonly IAnalysisStep[] = ANALYSIS_PIPELINE,
): Promise<IAnalysisContext> {
  return runPipeline(context, pipeline);
}
