import { extractKeywords } from '../../services/keyword-extraction/extract-keywords/extract-keywords';
import { runPipeline } from '../pipeline';
import { applyRunRules } from '../../services/run-rules/run-rules.registry';
import { evaluateSeoRules } from '../../services/seo-rules/seo-rules.registry';
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

/** What is wrong with each page, judged on the page alone, one pass over the rules. */
export const PAGE_RULES_STEP: IAnalysisStep = {
  name: 'page-rules',
  run(context) {
    context.evaluations = context.pages.map((page) => evaluateSeoRules(page));
  },
};

/**
 * What the pages share, which no page can see about itself: two of them written for
 * one query, or given one title. It EXTENDS the evaluations the page rules filled
 * rather than reporting separately, so a page keeps one score over one denominator.
 *
 * Last in the list, and after `keywords`, because it reads both of their outputs.
 */
export const RUN_RULES_STEP: IAnalysisStep = {
  name: 'run-rules',
  run(context) {
    context.evaluations = applyRunRules(
      { pages: context.pages, keywords: context.keywords },
      context.evaluations,
    );
  },
};

/**
 * Everything the analysis says about one crawl, as the ordered list of what it does.
 *
 * Two steps today, and the list earns itself on the third: the checks this needs next
 * are run-scoped (titles duplicated across the site, keyword cannibalisation, orphan
 * pages) and network-bound (Lighthouse, broken links). Each of those is a step added
 * here that extends the same `evaluations` — not a second analysis beside this one,
 * which is how a page would end up with two scores and two denominators.
 *
 * The first two steps are independent of each other; `run-rules` is not, and says so
 * above — it reads what both of them left. What the list fixes is WHICH work is done,
 * and, where a step declares it, the order its inputs require.
 */
export const ANALYSIS_PIPELINE: readonly IAnalysisStep[] = [
  KEYWORDS_STEP,
  PAGE_RULES_STEP,
  RUN_RULES_STEP,
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
