import { Injectable } from '@nestjs/common';
import type { ISeoIssue } from '@app/contracts';
import type { IParsedPage } from '../../interfaces/parsed-page.interface';
import { extractKeywords } from '../keyword-extraction/extract-keywords/extract-keywords';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';
import { evaluateSeoRules } from '../seo-rules/seo-rules.registry';

/** One fetched page, as the analysis needs it. */
export interface IAnalysisInput {
  url: string;
  finalUrl: string;
  redirected: boolean;
  headers: Record<string, string>;
  responseMs: number;
  htmlBytes: number;
  parsed: IParsedPage;
}

export interface IPageAnalysis {
  keywords: ISelectedKeyword[];
  issues: ISeoIssue[];
}

/**
 * The business opinions about a run's pages — which keywords each targets and what
 * is wrong with it. Pure: no I/O, no clock, so the crawl can run it outside any
 * transaction and a test can run it on fixtures.
 */
@Injectable()
export class PageAnalysisService {
  /** Keywords need the whole run (IDF); issues need each page's top keyword. */
  analyseRun(pages: IAnalysisInput[], siteKey: string): IPageAnalysis[] {
    const keywords = extractKeywords(pages, siteKey);
    return pages.map((page, i) => ({
      keywords: keywords[i],
      issues: evaluateSeoRules({
        ...page,
        topKeyword: keywords[i][0]?.term ?? null,
      }),
    }));
  }
}
