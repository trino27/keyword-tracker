import { Injectable } from '@nestjs/common';
import type { TSeoIssue } from '@app/contracts';
import { extractKeywords } from '../keyword-extraction/extract-keywords/extract-keywords';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';
import type { ISeoRuleInput } from '../seo-rules/seo-rule.interface';
import { evaluateSeoRules } from '../seo-rules/seo-rules.registry';

/** One fetched page, as the analysis needs it. */
export interface IAnalysisInput extends ISeoRuleInput {
  /**
   * Time to first byte. Stored on the page as a fact of the crawl; no rule reads it,
   * because a measurement of the crawler is not a property of the page.
   */
  responseMs: number;
}

export interface IPageAnalysis {
  keywords: ISelectedKeyword[];
  issues: TSeoIssue[];
}

/**
 * The business opinions about a run's pages — which keywords each targets and what
 * is wrong with it. Pure: no I/O, no clock, so the crawl can run it outside any
 * transaction and a test can run it on fixtures.
 */
@Injectable()
export class PageAnalysisService {
  /** Keywords need the whole run (IDF); the rules need only the page in front of them. */
  analyseRun(pages: IAnalysisInput[], siteKey: string): IPageAnalysis[] {
    const keywords = extractKeywords(pages, siteKey);
    return pages.map((page, i) => ({
      keywords: keywords[i],
      issues: evaluateSeoRules(page),
    }));
  }
}
