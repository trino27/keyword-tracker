import { makeCheckInput } from '../../services/checks/_testing/make-check-input';
import {
  ANALYSIS_PIPELINE,
  CHECKS_STEP,
  KEYWORDS_STEP,
  emptyAnalysisContext,
  runAnalysisPipeline,
} from './analysis-pipeline';
import type { IAnalysisInput, IAnalysisStep } from './analysis-step.interface';

const page = (title: string, url: string): IAnalysisInput => ({
  ...makeCheckInput({ url, finalUrl: url, parsed: { title } }),
  responseMs: 200,
});

const RUN: IAnalysisInput[] = [
  page('Link building for small sites', 'https://a.example/links/'),
  page('Technical SEO audits explained', 'https://a.example/audits/'),
];

describe('ANALYSIS_PIPELINE', () => {
  it('is what the analysis does, in the order it does it', async () => {
    expect(ANALYSIS_PIPELINE.map((step) => step.name)).toEqual([
      'keywords',
      'checks',
    ]);
  });

  it('fills one verdict per page per step', async () => {
    const context = await runAnalysisPipeline(
      emptyAnalysisContext(RUN, 'a.example'),
    );

    expect(context.keywords).toHaveLength(RUN.length);
    expect(context.evaluations).toHaveLength(RUN.length);
    expect(context.evaluations[0].checksApplicable).toBeGreaterThan(0);
  });

  it('runs only the steps it is given', async () => {
    const context = await runAnalysisPipeline(
      emptyAnalysisContext(RUN, 'a.example'),
      [CHECKS_STEP],
    );

    expect(context.evaluations).toHaveLength(RUN.length);
    expect(context.keywords).toEqual([]);
  });

  it('lets a later step add a finding to the evaluation the checks left', async () => {
    /** The shape a network-bound step has: it judges the run, it writes per page. */
    const duplicateTitles: IAnalysisStep = {
      name: 'lighthouse',
      run(context) {
        for (const evaluation of context.evaluations) {
          evaluation.checksJudged.push('TITLE_MISSING');
          evaluation.checksApplicable += 1;
        }
      },
    };
    const context = await runAnalysisPipeline(
      emptyAnalysisContext(RUN, 'a.example'),
      [...ANALYSIS_PIPELINE, duplicateTitles],
    );
    const plain = await runAnalysisPipeline(
      emptyAnalysisContext(RUN, 'a.example'),
    );

    // One page, one evaluation, one denominator — however many steps contributed.
    expect(context.evaluations[0].checksApplicable).toBe(
      plain.evaluations[0].checksApplicable + 1,
    );
  });

  it('is the list the keywords step reads the whole run from', async () => {
    const one = await runAnalysisPipeline(
      emptyAnalysisContext([RUN[0]], 'a.example'),
      [KEYWORDS_STEP],
    );

    expect(one.keywords).toHaveLength(1);
  });
});
