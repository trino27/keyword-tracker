import { Injectable } from '@nestjs/common';
import {
  ANALYSIS_PIPELINE,
  emptyAnalysisContext,
  runAnalysisPipeline,
} from '../../pipelines/analysis-pipeline/analysis-pipeline';
import type {
  IAnalysisInput,
  IAnalysisStep,
} from '../../pipelines/analysis-pipeline/analysis-step.interface';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';
import type { ISeoEvaluation } from '../checks/checks.registry';

export type { IAnalysisInput };

/**
 * The whole verdict on one page: its keywords, and everything one pass over the checks
 * concluded. Extends `ISeoEvaluation` rather than restating its fields, because
 * `analyseRun` spreads the evaluation whole and a restated copy is a copy to forget.
 */
export interface IPageAnalysis extends ISeoEvaluation {
  keywords: ISelectedKeyword[];
}

/**
 * The business opinions about a run's pages — which keywords each targets and what is
 * wrong with it. Pure: no I/O, no clock, so the crawl can run it outside any
 * transaction and a test can run it on fixtures.
 *
 * The work itself is `ANALYSIS_PIPELINE`; this is the crawl's door to it, and the one
 * place the per-page shape is assembled from what the steps left.
 */
@Injectable()
export class PageAnalysisService {
  async analyseRun(
    pages: IAnalysisInput[],
    siteKey: string,
    pipeline: readonly IAnalysisStep[] = ANALYSIS_PIPELINE,
  ): Promise<IPageAnalysis[]> {
    const context = await runAnalysisPipeline(
      emptyAnalysisContext(pages, siteKey),
      pipeline,
    );
    return pages.map((_, index) => ({
      keywords: context.keywords[index],
      ...context.evaluations[index],
    }));
  }
}
