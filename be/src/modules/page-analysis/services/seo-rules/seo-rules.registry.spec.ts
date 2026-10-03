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

  it('a clean page has no issues', () => {
    expect(evaluateSeoRules(makeRuleInput())).toEqual([]);
  });

  it('reports catalogue severity and order', () => {
    const issues = evaluateSeoRules(
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
      const issues = evaluateSeoRules(
        makeRuleInput({
          url,
          finalUrl: url,
          htmlBytes: Buffer.byteLength(html),
          responseMs: entry.ttfbMs ?? 0,
          headers: entry.headers ?? {},
          topKeyword: null,
          parsed: extractPage(html, url),
        }),
      );
      for (const issue of issues) {
        expect(SEO_ISSUE_CATALOGUE[issue.code].severity).toBe(issue.severity);
      }
    }
  });
});
