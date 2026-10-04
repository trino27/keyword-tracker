import type { ISelectedKeyword } from '../select-keywords/select-keywords';
import {
  KEYWORD_PIPELINE,
  emptyContext,
  runKeywordPipeline,
} from '../../../pipelines/keyword-pipeline/keyword-pipeline';
import type {
  IKeywordSource,
  IKeywordStep,
} from '../../../pipelines/keyword-pipeline/keyword-step.interface';

export type { IKeywordSource };

/**
 * The keywords of every page of one run (§10.4). Computed for the run as a whole,
 * twice over: what the pages share tells a site's chrome from a page's subject BEFORE
 * scoring, and the IDF step damps what is left of it after.
 *
 * The work itself is `KEYWORD_PIPELINE`, an ordered list of steps over one context;
 * this is the caller's door to it. `pipeline` is a parameter so an experiment — a
 * stemming step, a replaced corpus penalty — runs beside the default rather than
 * instead of it.
 */
export async function extractKeywords(
  pages: readonly IKeywordSource[],
  siteKey: string,
  pipeline: readonly IKeywordStep[] = KEYWORD_PIPELINE,
): Promise<ISelectedKeyword[][]> {
  const context = await runKeywordPipeline(
    emptyContext(pages, siteKey),
    pipeline,
  );
  return context.keywords;
}
