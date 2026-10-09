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
          [keywordsOf('link building'), keywordsOf('technical audits')],
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
              canonicals: [],
              images: [],
              headings: [{ level: 1, text: 'Only one heading' }],
              alternates: [],
              jsonLd: { types: [], keywords: [], articleFields: [] },
              // No links to another page of the site, so neither link check that
              // reads them has anything to judge.
              links: [],
              // And no date to contradict.
              datePublished: null,
            },
            // A robots.txt that governs no host this page touches: neither robots
            // check has a rule to read.
            robots: { allows: () => null, matchingRule: () => null },
            // http, so MIXED_CONTENT has nothing to mix. The page is bare in every
            // sense a check can be skipped for, which is what this case is for.
            url: 'http://a.example/post/',
            finalUrl: 'http://a.example/post/',
          }),
        ]),
      )[0];

    // A run of one page cannot answer a run-scoped check either, so this is the whole
    // conditional set at once — the thirteen a page can skip and the three a run can.
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

  /**
   * Every check can fail, and every failure shows its proof. Two copies of one broken
   * page and one page broken the opposite way between them fail the whole catalogue —
   * a check that could not fail here is a check that cannot fail — and each finding
   * must quote what it found, because a claim the reader cannot check against the page
   * source is one they have to take on trust.
   */
  it('lets every check fail, and every failure carry evidence', () => {
    const blocked = {
      allows: (url: string) =>
        new URL(url).hostname === 'a.example' ? false : null,
      matchingRule: () => 'line 2: Disallow: /',
    };
    // Thirty different words, ten times over: enough text for two copies to be compared.
    const sameText = Array.from(
      { length: 10 },
      (_, n) =>
        Array.from({ length: 30 }, (_, k) => `word${n}x${k}`).join(' ') + '.',
    );
    const broken = (path: string) =>
      runPage(path, {
        previous: {
          contentHash: 'f'.repeat(64),
          dateModified: '2026-01-01',
          crawledAt: new Date('2026-09-01T00:00:00Z'),
        },
        redirected: true,
        redirects: [{ url: `https://a.example/${path}-old/`, status: 302 }],
        robots: blocked,
        headers: { 'content-type': 'text/html' },
        htmlBytes: 2_000_000,
        parsed: {
          title: 'Shared title',
          metaDescription: 'Too short',
          metaRobots: 'noindex, nosnippet',
          relativeCanonicals: ['/x/'],
          unnamedLinks: [
            {
              href: 'https://a.example/other/',
              markup: '<a href="/other/"><img src="i.png"></a>',
            },
          ],
          jsonLdErrors: ['{"@type": "Article",} — Unexpected token'],
          charsetDeclarationEnd: 2_000,
          datePublished: '2026-11-30',
          authors: [],
          contentHash: 'f'.repeat(64),
          dateModified: '2026-10-01',
          blocks: sameText,
          metaRefresh: '0; url=/elsewhere/',
          viewport: null,
          canonicals: ['https://a.example/x/', 'https://a.example/y/'],
          alternates: [{ lang: 'english', href: 'https://a.example/en/' }],
          openGraph: { 'og:url': 'https://staging.a.example/post/' },
          jsonLd: { types: [], keywords: [], articleFields: [] },
          lang: null,
          h1s: ['One', 'Two'],
          headings: [
            { level: 1, text: 'One' },
            { level: 3, text: 'Three' },
          ],
          images: [{ src: 'a.png', alt: null }],
          resourceUrls: ['http://a.example/i.png'],
          renderResources: ['https://a.example/app.js'],
          links: ['http://a.example/other/?utm_source=x'],
          nofollowLinks: ['http://a.example/other/?utm_source=x'],
          uncrawlableLinks: ['<a onclick="go()">Go</a>'],
          wordCount: 100,
        },
      });
    const opposite = makeCheckInput({
      url: 'http://a.example/plain/',
      finalUrl: 'http://a.example/plain/',
      robots: blocked,
      parsed: {
        title: null,
        metaDescription: null,
        canonicals: [],
        h1s: [],
        links: [],
        jsonLd: { types: ['Article'], keywords: [], articleFields: [] },
      },
    });

    const evaluations = evaluateChecks(
      makeRunInput(
        [broken('a'), broken('b'), opposite],
        [keywordsOf('same'), keywordsOf('same'), keywordsOf('other')],
      ),
    );
    const issues = evaluations.flatMap((evaluation) => evaluation.issues);

    expect([...new Set(issues.map(({ code }) => code))].sort()).toEqual(
      [...ACTIVE_ISSUE_CODES].sort(),
    );
    for (const issue of issues) {
      const { evidence } = issue.details as { evidence?: unknown };
      expect([issue.code, evidence]).toEqual([
        issue.code,
        expect.arrayContaining([expect.stringMatching(/\S/)]),
      ]);
    }
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
      // Sixteen checks always apply and the rest are conditional, so no real page can
      // produce a denominator small enough to make its score meaningless. This is the
      // assertion that fails the day an applicability condition is written too broadly.
      expect(checksApplicable).toBeGreaterThanOrEqual(
        ACTIVE_ISSUE_CODES.length - CONDITIONAL_ISSUE_CODES.length,
      );
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
