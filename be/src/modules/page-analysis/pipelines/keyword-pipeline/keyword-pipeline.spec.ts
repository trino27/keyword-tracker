import { makeRuleInput } from '../../services/seo-rules/_testing/make-rule-input';
import { extractKeywords } from '../../services/keyword-extraction/extract-keywords/extract-keywords';
import {
  COLLECT_STEP,
  DOCUMENT_FREQUENCY_STEP,
  KEYWORD_PIPELINE,
  RUN_BOILERPLATE_STEP,
  emptyContext,
  runKeywordPipeline,
} from './keyword-pipeline';
import { insertAfter, stepNames } from '../pipeline';
import type { IKeywordSource, IKeywordStep } from './keyword-step.interface';

function page(title: string, blocks: string[], url = 'https://a.example/p/') {
  return { url, parsed: makeRuleInput({ parsed: { title, blocks } }).parsed };
}

const RUN: IKeywordSource[] = [
  page('Link building for small sites', [
    'Link building is how small sites earn links.',
    'Link building takes time.',
  ]),
  page(
    'Technical SEO audits explained',
    ['A technical SEO audit finds what crawlers cannot read.'],
    'https://a.example/audit/',
  ),
];

describe('KEYWORD_PIPELINE', () => {
  it('is the algorithm in the order it runs', async () => {
    expect(KEYWORD_PIPELINE.map((step) => step.name)).toEqual([
      'run-boilerplate',
      'collect',
      'document-frequency',
      'score',
      'select',
    ]);
  });

  it('fills one field per step, in order', async () => {
    const context = emptyContext(RUN, 'a.example');
    await runKeywordPipeline(context, [RUN_BOILERPLATE_STEP]);
    expect(context.candidates).toEqual([]);

    await runKeywordPipeline(context, [COLLECT_STEP]);
    expect(context.candidates).toHaveLength(RUN.length);
    expect(context.documentFrequency.size).toBe(0);

    await runKeywordPipeline(context, [DOCUMENT_FREQUENCY_STEP]);
    expect(context.documentFrequency.size).toBeGreaterThan(0);
    expect(context.keywords).toEqual([]);
  });

  it('runs the default pipeline when the caller names none', async () => {
    const keywords = await extractKeywords(RUN, 'a.example');
    expect(keywords).toHaveLength(RUN.length);
    expect(keywords[0].length).toBeGreaterThan(0);
  });
});

describe('a step inserted into the pipeline', () => {
  /** The shape the planned stemming step has: it rewrites candidates in place. */
  const dropLinkBuilding: IKeywordStep = {
    name: 'drop-term',
    run(context) {
      for (const candidates of context.candidates)
        candidates.delete('link building');
    },
  };

  it('is seen by every step after it and by nothing before it', async () => {
    const [before] = await extractKeywords(RUN, 'a.example');
    expect(before.map((keyword) => keyword.term)).toContain('link building');

    const index = KEYWORD_PIPELINE.indexOf(DOCUMENT_FREQUENCY_STEP);
    const withStep = [
      ...KEYWORD_PIPELINE.slice(0, index),
      dropLinkBuilding,
      ...KEYWORD_PIPELINE.slice(index),
    ];
    const [after] = await extractKeywords(RUN, 'a.example', withStep);

    expect(after.map((keyword) => keyword.term)).not.toContain('link building');
  });

  it('takes an ASYNC step inserted between two others, and uses what it wrote', async () => {
    // The shape a model step has: it awaits something, rewrites the scores `score`
    // produced, and `select` reads the result without knowing it arrived. Nothing in
    // KEYWORD_PIPELINE is edited to let it in.
    const rerank: IKeywordStep = {
      name: 'rerank',
      async run(context) {
        await Promise.resolve();
        context.scored = context.scored.map((candidates) =>
          candidates.map((candidate) => ({
            ...candidate,
            score: candidate.term === 'small sites' ? 1000 : candidate.score,
          })),
        );
      },
    };
    const withModel = insertAfter(KEYWORD_PIPELINE, 'score', rerank);

    expect(stepNames(withModel)).toEqual([
      'run-boilerplate',
      'collect',
      'document-frequency',
      'score',
      'rerank',
      'select',
    ]);
    const context = await runKeywordPipeline(
      emptyContext(RUN, 'a.example'),
      withModel,
    );
    expect(context.keywords[0][0].term).toBe('small sites');

    // And the default pipeline is unchanged by having been composed from.
    const plain = await runKeywordPipeline(emptyContext(RUN, 'a.example'));
    expect(plain.keywords[0][0].term).not.toBe('small sites');
  });

  it('replaces a step by position without touching its neighbours', async () => {
    const noKeywords: IKeywordStep = {
      name: 'select',
      run(context) {
        context.keywords = context.pages.map(() => []);
      },
    };
    const replaced = KEYWORD_PIPELINE.map((step) =>
      step.name === 'select' ? noKeywords : step,
    );
    const context = await runKeywordPipeline(
      emptyContext(RUN, 'a.example'),
      replaced,
    );

    expect(context.keywords).toEqual([[], []]);
    // The steps before it ran as they always do.
    expect(context.scored[0].length).toBeGreaterThan(0);
  });
});
