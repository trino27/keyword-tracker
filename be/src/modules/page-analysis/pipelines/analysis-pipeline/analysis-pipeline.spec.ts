import { makeRuleInput } from '../../services/seo-rules/_testing/make-rule-input';
import {
  ANALYSIS_PIPELINE,
  KEYWORDS_STEP,
  PAGE_RULES_STEP,
  emptyAnalysisContext,
  runAnalysisPipeline,
} from './analysis-pipeline';
import type { IAnalysisInput, IAnalysisStep } from './analysis-step.interface';

const page = (title: string, url: string): IAnalysisInput => ({
  ...makeRuleInput({ url, finalUrl: url, parsed: { title } }),
  responseMs: 200,
});

const RUN: IAnalysisInput[] = [
  page('Link building for small sites', 'https://a.example/links/'),
  page('Technical SEO audits explained', 'https://a.example/audits/'),
];

describe('ANALYSIS_PIPELINE', () => {
  it('is what the analysis does, in the order it does it', () => {
    expect(ANALYSIS_PIPELINE.map((step) => step.name)).toEqual([
      'keywords',
      'page-rules',
    ]);
  });

  it('fills one verdict per page per step', () => {
    const context = runAnalysisPipeline(emptyAnalysisContext(RUN, 'a.example'));

    expect(context.keywords).toHaveLength(RUN.length);
    expect(context.evaluations).toHaveLength(RUN.length);
    expect(context.evaluations[0].checksApplicable).toBeGreaterThan(0);
  });

  it('runs only the steps it is given', () => {
    const context = runAnalysisPipeline(
      emptyAnalysisContext(RUN, 'a.example'),
      [PAGE_RULES_STEP],
    );

    expect(context.evaluations).toHaveLength(RUN.length);
    expect(context.keywords).toEqual([]);
  });

  it('lets a later step add a finding to the evaluation the rules left', () => {
    /** The shape a run-scoped check has: it judges the run, it writes per page. */
    const duplicateTitles: IAnalysisStep = {
      name: 'run-rules',
      run(context) {
        for (const evaluation of context.evaluations) {
          evaluation.checksJudged.push('TITLE_MISSING');
          evaluation.checksApplicable += 1;
        }
      },
    };
    const context = runAnalysisPipeline(
      emptyAnalysisContext(RUN, 'a.example'),
      [...ANALYSIS_PIPELINE, duplicateTitles],
    );
    const plain = runAnalysisPipeline(emptyAnalysisContext(RUN, 'a.example'));

    // One page, one evaluation, one denominator — however many steps contributed.
    expect(context.evaluations[0].checksApplicable).toBe(
      plain.evaluations[0].checksApplicable + 1,
    );
  });

  it('is the list the keywords step reads the whole run from', () => {
    const one = runAnalysisPipeline(
      emptyAnalysisContext([RUN[0]], 'a.example'),
      [KEYWORDS_STEP],
    );

    expect(one.keywords).toHaveLength(1);
  });
});
