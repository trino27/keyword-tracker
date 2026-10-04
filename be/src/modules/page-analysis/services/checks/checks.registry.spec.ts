import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ACTIVE_ISSUE_CODES,
  CONDITIONAL_ISSUE_CODES,
  RUN_ISSUE_CODES,
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  skipReasonOf,
  type TSeoIssueCode,
} from '@app/contracts';
import {
  FIXTURES_ROOT,
  loadFixtureManifest,
} from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { extractPage } from '../html-extraction/extract-page';
import type { ISelectedKeyword } from '../keyword-extraction/select-keywords/select-keywords';
import { makeCheckInput } from './_testing/make-check-input';
import { keywordsOf, makeRunInput, runPage } from './_testing/make-run-input';
import { CHECKS, evaluateChecks } from './checks.registry';
import { NOT_APPLICABLE } from './check.interface';

/** Every recorded post (not sitemaps, feeds, robots or home pages). */
const recordedPosts = () =>
  Object.entries(loadFixtureManifest().entries).filter(
    ([url, entry]) =>
      entry.file?.endsWith('.html') &&
      new URL(url).pathname !== '/' &&
      entry.headers?.['content-type']?.includes('text/html'),
  );

/** Two pages that share nothing, so only the page-scoped checks can have an opinion. */
const twoUnrelatedPages = () =>
  makeRunInput(
    [
      runPage('a', {
        parsed: { title: 'A complete guide to link building now' },
      }),
      runPage('b', {
        parsed: {
          title: 'Everything about technical audits for small teams',
          metaDescription:
            'A different description, long enough to sit inside the bounds the catalogue sets for one.',
        },
      }),
    ],
    [keywordsOf('link building'), keywordsOf('technical audits')],
  );

describe('CHECKS', () => {
  it('has exactly one check per catalogued code', () => {
    expect(Object.keys(CHECKS).sort()).toEqual([...SEO_ISSUE_CODES].sort());
  });

  // The key alone is not enough: two unmeasured checks are structurally identical, so
  // without the code on the unit, registering one under the other's key would compile.
  it('registers every check under the code it carries', () => {
    for (const code of SEO_ISSUE_CODES) {
      expect(CHECKS[code].code).toBe(code);
    }
  });

  // What a check reads follows from the catalogue, never from the check — which is what
  // makes a run-shaped check under a page code a compile error rather than a silent no-op.
  it('gives a check the shape its catalogue scope calls for', () => {
    for (const code of SEO_ISSUE_CODES) {
      const expected = (RUN_ISSUE_CODES as TSeoIssueCode[]).includes(code)
        ? 'run'
        : 'page';
      expect(CHECKS[code].scope).toBe(expected);
    }
  });
});

describe('evaluateChecks', () => {
  it('finds nothing on two clean, unrelated pages, and applies every check', () => {
    const [first] = evaluateChecks(twoUnrelatedPages());

    expect(first).toEqual({
      issues: [],
      checksJudged: ACTIVE_ISSUE_CODES,
      checksNotApplicable: [],
      checksApplicable: ACTIVE_ISSUE_CODES.length,
      checksFailed: 0,
    });
  });

  it('does not count against a page a check that could not be judged', () => {
    // No title: TITLE_LENGTH has nothing to measure, and TITLE_DUPLICATE has nothing to
    // compare. Passing either would reward the page for the very thing TITLE_MISSING is
    // failing it for.
    const run = twoUnrelatedPages();
    const { issues, checksApplicable, checksFailed, checksNotApplicable } =
      evaluateChecks(
        makeRunInput(
          [runPage('a', { parsed: { title: null } }), run.pages[1]],
          run.keywords as ISelectedKeyword[][],
        ),
      )[0];

    expect(checksApplicable).toBe(ACTIVE_ISSUE_CODES.length - 2);
    expect(issues.map(({ code }) => code)).toEqual(['TITLE_MISSING']);
    expect(checksFailed).toBe(1);
    // Named, not counted: the screen quotes this code's reason back to the reader, so
    // the wrong code here would show "no title to measure" against the wrong check.
    expect(checksNotApplicable).toEqual(['TITLE_LENGTH', 'TITLE_DUPLICATE']);
  });

  it('drops every conditional check together on a bare page in a run of one', () => {
    const { checksApplicable, checksJudged, checksNotApplicable } =
      evaluateChecks(
        makeRunInput([
          makeCheckInput({
            parsed: {
              title: null,
              metaDescription: null,
              canonical: null,
              images: [],
              headings: [{ level: 1, text: 'Only one heading' }],
            },
          }),
        ]),
      )[0];

    // A run of one page cannot answer a run-scoped check either, so this is the whole
    // conditional set at once — the five a page can skip and the three a run can.
    expect(checksApplicable).toBe(
      ACTIVE_ISSUE_CODES.length - CONDITIONAL_ISSUE_CODES.length,
    );
    expect([...checksNotApplicable].sort()).toEqual(
      [...CONDITIONAL_ISSUE_CODES].sort(),
    );
    // Disjoint, and together the whole catalogue this crawl ran: the pair IS that
    // record, so a code in neither would later read as one the catalogue gained since,
    // and a code in both would render with two statuses.
    expect(
      checksJudged.filter((code) => checksNotApplicable.includes(code)),
    ).toEqual([]);
    expect([...checksJudged, ...checksNotApplicable].sort()).toEqual(
      [...ACTIVE_ISSUE_CODES].sort(),
    );
  });

  it('keeps checksFailed equal to the number of issues', () => {
    for (const evaluation of evaluateChecks(
      makeRunInput(
        [
          runPage('a', { parsed: { title: null, lang: null, h1s: [] } }),
          runPage('b'),
        ],
        [keywordsOf('one'), keywordsOf('two')],
      ),
    )) {
      expect(evaluation.checksFailed).toBe(evaluation.issues.length);
    }
  });

  /**
   * The ordering assertion, and the reason the pass is one loop: a run-scoped finding
   * takes its place among the page-scoped ones by catalogue position. Built as two
   * separate passes, the run findings arrived last and had to be sorted back in.
   */
  it('reports catalogue severity, with a run finding in its catalogue place', () => {
    const [{ issues }] = evaluateChecks(
      makeRunInput(
        [
          runPage('a', { parsed: { title: 'Shared', lang: null } }),
          runPage('b', { parsed: { title: 'Shared' } }),
        ],
        [keywordsOf('one'), keywordsOf('two')],
      ),
    );

    expect(issues.map(({ code, severity }) => [code, severity])).toEqual([
      ['TITLE_LENGTH', 'notice'],
      ['LANG_MISSING', 'notice'],
      ['TITLE_DUPLICATE', 'warning'],
      ['META_DESCRIPTION_DUPLICATE', 'notice'],
    ]);
  });

  it('runs a registry it is given instead of the default one', () => {
    const { checksJudged, checksNotApplicable } = evaluateChecks(
      twoUnrelatedPages(),
      {
        ...CHECKS,
        NOT_HTTPS: { ...CHECKS.NOT_HTTPS, evaluate: () => NOT_APPLICABLE },
      },
    )[0];

    expect(checksNotApplicable).toEqual(['NOT_HTTPS']);
    expect(checksJudged).not.toContain('NOT_HTTPS');
  });

  /**
   * A run check owes one verdict per page. A short answer would silently shrink one
   * page's denominator, and a score over a denominator nobody chose is worse than a
   * crawl that stops.
   */
  it('refuses a run check that does not answer for every page', () => {
    expect(() =>
      evaluateChecks(twoUnrelatedPages(), {
        ...CHECKS,
        TITLE_DUPLICATE: {
          ...CHECKS.TITLE_DUPLICATE,
          evaluate: () => [NOT_APPLICABLE],
        },
      }),
    ).toThrow(/TITLE_DUPLICATE returned 1 verdicts for 2 pages/);
  });

  it('emits only catalogued codes over every recorded page', () => {
    const posts = recordedPosts();
    expect(posts.length).toBeGreaterThan(30);

    const pages = posts.map(([url, entry]) => {
      const html = readFileSync(
        join(FIXTURES_ROOT, 'sites', entry.file!),
        'utf8',
      );
      return makeCheckInput({
        url,
        finalUrl: url,
        htmlBytes: Buffer.byteLength(html),
        headers: entry.headers ?? {},
        parsed: extractPage(html, url),
      });
    });

    for (const {
      issues,
      checksApplicable,
      checksFailed,
      checksJudged,
      checksNotApplicable,
    } of evaluateChecks(makeRunInput(pages))) {
      for (const issue of issues) {
        expect(SEO_ISSUE_CATALOGUE[issue.code].severity).toBe(issue.severity);
      }
      // Thirteen checks always apply and the rest are conditional, so no real page can
      // produce a denominator small enough to make its score meaningless. This is the
      // assertion that fails the day an applicability condition is written too broadly.
      expect(checksApplicable).toBeGreaterThanOrEqual(13);
      expect(checksApplicable).toBeLessThanOrEqual(ACTIVE_ISSUE_CODES.length);
      expect(checksFailed).toBe(issues.length);
      // The pair accounts for the whole active catalogue on every real page, and the
      // count is the judged list's length — the two things the database enforces as
      // CHECK constraints, asserted here against pages nobody wrote for this test.
      expect(checksApplicable).toBe(checksJudged.length);
      expect([...checksJudged, ...checksNotApplicable].sort()).toEqual(
        [...ACTIVE_ISSUE_CODES].sort(),
      );
      // Every skipped code owes the reader a reason; an unreasoned one renders blank.
      for (const code of checksNotApplicable) {
        expect(skipReasonOf(code)).toMatch(/\S/);
      }
    }
  });
});
