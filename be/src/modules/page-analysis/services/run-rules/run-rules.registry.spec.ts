import { RUN_ISSUE_CODES } from '@app/contracts';
import { makeRuleInput } from '../seo-rules/_testing/make-rule-input';
import { evaluateSeoRules } from '../seo-rules/seo-rules.registry';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';
import type { ISeoRuleInput } from '../seo-rules/seo-rule.interface';
import { RUN_RULES, applyRunRules } from './run-rules.registry';

const page = (
  url: string,
  title: string | null,
  metaDescription:
    | string
    | null = 'A description long enough to be judged on its own merits here.',
): ISeoRuleInput => ({
  ...makeRuleInput({ parsed: { title, metaDescription } }),
  url,
});

const top = (term: string): ISelectedKeyword[] => [{ term, relevance: 1 }];

const run = (pages: ISeoRuleInput[], keywords: ISelectedKeyword[][]) =>
  applyRunRules({ pages, keywords }, pages.map(evaluateSeoRules));

const codesOn = (evaluation: { issues: { code: string }[] }) =>
  evaluation.issues.map((issue) => issue.code);

describe('RUN_RULES', () => {
  it('has exactly one rule per catalogued RUN code', () => {
    expect(Object.keys(RUN_RULES).sort()).toEqual([...RUN_ISSUE_CODES].sort());
  });
});

describe('applyRunRules', () => {
  it('flags both pages that lead with the same keyword, and names the other', () => {
    // The real case: Semrush's "What is AI marketing?" and "AI Marketing Guide" both
    // come back with `ai marketing` first, and neither page can see the other.
    const [first, second] = run(
      [
        page('https://a.example/what/', 'What is AI marketing?'),
        page('https://a.example/guide/', 'AI Marketing Guide'),
      ],
      [top('ai marketing'), top('ai marketing')],
    );

    expect(codesOn(first)).toContain('KEYWORD_CANNIBALISATION');
    expect(codesOn(second)).toContain('KEYWORD_CANNIBALISATION');
    expect(
      first.issues.find((issue) => issue.code === 'KEYWORD_CANNIBALISATION')
        ?.details,
    ).toEqual({
      term: 'ai marketing',
      otherUrls: ['https://a.example/guide/'],
    });
  });

  it('leaves pages with different keywords alone', () => {
    const [first] = run(
      [page('https://a.example/a/', 'A'), page('https://a.example/b/', 'B')],
      [top('ai marketing'), top('keyword research')],
    );
    expect(codesOn(first)).not.toContain('KEYWORD_CANNIBALISATION');
    expect(first.checksJudged).toContain('KEYWORD_CANNIBALISATION');
  });

  it('flags a title and a description two pages share', () => {
    const [first] = run(
      [
        page(
          'https://a.example/a/',
          'Same title',
          'Same description, long enough to be a real one.',
        ),
        page(
          'https://a.example/b/',
          'Same title',
          'Same description, long enough to be a real one.',
        ),
      ],
      [top('one'), top('two')],
    );
    expect(codesOn(first)).toEqual(
      expect.arrayContaining(['TITLE_DUPLICATE', 'META_DESCRIPTION_DUPLICATE']),
    );
  });

  it('compares titles as the reader sees them, not byte for byte', () => {
    const [first] = run(
      [
        page('https://a.example/a/', 'Local SEO Guide'),
        page('https://a.example/b/', '  local seo guide '),
      ],
      [top('one'), top('two')],
    );
    expect(codesOn(first)).toContain('TITLE_DUPLICATE');
  });

  it('judges nothing on a run of one page, and counts none of it', () => {
    // Not a pass: a page cannot be the only one and also be compared with others.
    // Counting these as passed would hand a single-page crawl three free points.
    const [only] = run([page('https://a.example/a/', 'Alone')], [top('alone')]);

    for (const code of RUN_ISSUE_CODES) {
      expect(only.checksNotApplicable).toContain(code);
      expect(only.checksJudged).not.toContain(code);
    }
  });

  it('skips a check the page has no value for', () => {
    const [untitled] = run(
      [page('https://a.example/a/', null), page('https://a.example/b/', 'B')],
      [top('one'), top('two')],
    );
    expect(untitled.checksNotApplicable).toContain('TITLE_DUPLICATE');
  });

  it('keeps one score over one denominator, with the issues in catalogue order', () => {
    const pages = [
      page('https://a.example/a/', 'Same title'),
      page('https://a.example/b/', 'Same title'),
    ];
    const before = pages.map(evaluateSeoRules);
    const [after] = applyRunRules(
      { pages, keywords: [top('x'), top('y')] },
      before,
    );

    expect(after.checksApplicable).toBe(after.checksJudged.length);
    expect(after.checksFailed).toBe(after.issues.length);
    // The run findings joined the page's own list rather than arriving beside it.
    expect(after.checksApplicable).toBeGreaterThan(before[0].checksApplicable);
    expect(after.issues.length).toBeGreaterThan(before[0].issues.length);
  });
});
