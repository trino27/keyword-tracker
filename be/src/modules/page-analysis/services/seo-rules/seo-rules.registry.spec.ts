import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEO_ISSUE_CATALOGUE, SEO_ISSUE_CODES } from '@app/contracts';
import {
  FIXTURES_ROOT,
  loadFixtureManifest,
} from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { extractPage } from '../html-extraction/extract-page';
import { makeRuleInput } from './_testing/make-rule-input';
import { evaluateSeoRules, SEO_RULES } from './seo-rules.registry';

/** Every recorded post (not sitemaps, feeds, robots or home pages). */
const recordedPosts = () =>
  Object.entries(loadFixtureManifest().entries).filter(
    ([url, entry]) =>
      entry.file?.endsWith('.html') &&
      new URL(url).pathname !== '/' &&
      entry.headers?.['content-type']?.includes('text/html'),
  );

describe('SEO_RULES', () => {
  it('has exactly one rule per catalogued code', () => {
    expect(Object.keys(SEO_RULES).sort()).toEqual([...SEO_ISSUE_CODES].sort());
  });

  it('a clean page has no issues, and every check applied to it', () => {
    expect(evaluateSeoRules(makeRuleInput())).toEqual({
      issues: [],
      checksApplicable: SEO_ISSUE_CODES.length,
      checksFailed: 0,
    });
  });

  it('a check that could not be judged is not counted against the page', () => {
    // No title: TITLE_LENGTH has nothing to measure. Passing it would reward the page
    // for the very thing TITLE_MISSING is failing it for.
    const { issues, checksApplicable, checksFailed } = evaluateSeoRules(
      makeRuleInput({ parsed: { title: null } }),
    );

    expect(checksApplicable).toBe(SEO_ISSUE_CODES.length - 1);
    expect(issues.map(({ code }) => code)).toEqual(['TITLE_MISSING']);
    expect(checksFailed).toBe(1);
  });

  it('the five conditional checks drop out together', () => {
    const { checksApplicable } = evaluateSeoRules(
      makeRuleInput({
        parsed: {
          title: null,
          metaDescription: null,
          canonical: null,
          images: [],
          headings: [{ level: 1, text: 'Only one heading' }],
        },
      }),
    );

    expect(checksApplicable).toBe(SEO_ISSUE_CODES.length - 5);
  });

  it('checksFailed is always the number of issues', () => {
    const { issues, checksFailed } = evaluateSeoRules(
      makeRuleInput({ parsed: { title: null, lang: null, h1s: [] } }),
    );

    expect(checksFailed).toBe(issues.length);
  });

  it('reports catalogue severity and order', () => {
    const { issues } = evaluateSeoRules(
      makeRuleInput({ parsed: { title: null, lang: null, h1s: [] } }),
    );

    expect(issues.map(({ code, severity }) => [code, severity])).toEqual([
      ['TITLE_MISSING', 'error'],
      ['H1_MISSING', 'error'],
      ['LANG_MISSING', 'notice'],
    ]);
  });

  it('emits only catalogued codes over every recorded page', () => {
    const posts = recordedPosts();
    expect(posts.length).toBeGreaterThan(30);

    for (const [url, entry] of posts) {
      const html = readFileSync(
        join(FIXTURES_ROOT, 'sites', entry.file!),
        'utf8',
      );
      const { issues, checksApplicable, checksFailed } = evaluateSeoRules(
        makeRuleInput({
          url,
          finalUrl: url,
          htmlBytes: Buffer.byteLength(html),
          headers: entry.headers ?? {},
          parsed: extractPage(html, url),
        }),
      );
      for (const issue of issues) {
        expect(SEO_ISSUE_CATALOGUE[issue.code].severity).toBe(issue.severity);
      }
      // Thirteen checks always apply and five are conditional, so no real page can
      // produce a denominator small enough to make its score meaningless. This is the
      // assertion that fails the day an applicability condition is written too broadly.
      expect(checksApplicable).toBeGreaterThanOrEqual(13);
      expect(checksApplicable).toBeLessThanOrEqual(SEO_ISSUE_CODES.length);
      expect(checksFailed).toBe(issues.length);
    }
  });
});
