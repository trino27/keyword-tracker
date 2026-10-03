import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIXTURES_ROOT,
  loadFixtureManifest,
} from '@infrastructure/remote-api/_testing/fixture-http-transport';
import {
  FLOOR_RATIO,
  MAX_KEYWORDS_PER_RUN,
  MAX_OVERLAP_RATIO,
} from '../../../constants/keyword-scoring.constant';
import { extractPage } from '../../html-extraction/extract-page';
import { normalizeText } from '../../text/normalize-text/normalize-text';
import { extractKeywords } from './extract-keywords';

/** The 15 posts a yoast crawl stores: post-sitemap positions 1–15 (0 is a listing). */
function yoastRun() {
  const sitemap = readFileSync(
    join(FIXTURES_ROOT, 'sites', 'yoast/post-sitemap.xml'),
    'utf8',
  );
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1])
    .slice(1, 16);
  const { entries } = loadFixtureManifest();
  return urls.map((url) => ({
    url,
    parsed: extractPage(
      readFileSync(join(FIXTURES_ROOT, 'sites', entries[url].file!), 'utf8'),
      url,
    ),
  }));
}

describe('extractKeywords (golden, recorded yoast posts)', () => {
  const pages = yoastRun();
  const keywords = extractKeywords(pages, 'yoast.com');
  const slugText = (url: string) =>
    normalizeText(new URL(url).pathname.split('/').filter(Boolean).pop()!);

  it('gives every page 1–8 keywords, the top at relevance 1', () => {
    expect(keywords).toHaveLength(15);
    for (const pageKeywords of keywords) {
      expect(pageKeywords.length).toBeGreaterThanOrEqual(1);
      expect(pageKeywords.length).toBeLessThanOrEqual(8);
      expect(pageKeywords[0].relevance).toBe(1);
    }
  });

  it('keeps nothing under the floor: a page about one thing returns one keyword', () => {
    for (const pageKeywords of keywords) {
      for (const keyword of pageKeywords) {
        expect(keyword.relevance).toBeGreaterThanOrEqual(FLOOR_RATIO);
      }
    }
    // "How to remove www from your URL" said it five ways and used to return all
    // five; its subject is now stated once and the rest of the list is other things.
    const index = pages.findIndex((page) =>
      page.url.endsWith('/how-to-remove-www-from-your-url/'),
    );
    const terms = keywords[index].map((keyword) => keyword.term);
    expect(terms[0]).toBe('remove www');
    expect(terms.filter((term) => term.includes('www'))).toEqual([
      'remove www',
    ]);
  });

  it('takes at most two keywords out of one sentence', () => {
    // The long headline of a news story has several windows and one subject.
    const perRun = new Map<string, number>();
    const index = pages.findIndex((page) =>
      page.url.endsWith(
        '/pressing-questions-about-gutenberg-the-new-editor-in-wordpress-5-0/',
      ),
    );
    for (const keyword of keywords[index]) {
      const title = normalizeText(pages[index].parsed.title ?? '');
      if (title.includes(keyword.term)) {
        perRun.set('title', (perRun.get('title') ?? 0) + 1);
      }
    }
    expect(perRun.get('title') ?? 0).toBeLessThanOrEqual(MAX_KEYWORDS_PER_RUN);
  });

  it('never returns two keywords that are windows of one phrase', () => {
    const words = (term: string) =>
      new Set(term.split(' ').filter((token) => token.length > 1));
    for (const pageKeywords of keywords) {
      for (const [i, a] of pageKeywords.entries()) {
        for (const b of pageKeywords.slice(i + 1)) {
          const left = words(a.term);
          const right = words(b.term);
          const shared = [...left].filter((word) => right.has(word)).length;
          expect(shared / Math.min(left.size, right.size)).toBeLessThan(
            MAX_OVERLAP_RATIO,
          );
        }
      }
    }
  });

  it('puts a phrase of the URL slug in the top 3 of "how to remove www from your url"', () => {
    const index = pages.findIndex((page) =>
      page.url.endsWith('/how-to-remove-www-from-your-url/'),
    );
    const top3 = keywords[index].slice(0, 3).map((keyword) => keyword.term);

    expect(
      top3.some((term) =>
        ` ${slugText(pages[index].url)} `.includes(` ${term} `),
      ),
    ).toBe(true);
  });

  it('puts a slug phrase in the top 3 of most pages', () => {
    const matching = pages.filter((page, i) =>
      keywords[i]
        .slice(0, 3)
        .some((keyword) =>
          ` ${slugText(page.url)} `.includes(` ${keyword.term} `),
        ),
    );

    expect(matching.length).toBeGreaterThanOrEqual(12);
  });

  it('never returns the brand word at all ("yoastcon", an event, is a topic)', () => {
    for (const pageKeywords of keywords) {
      expect(
        pageKeywords.some((keyword) => ` ${keyword.term} `.includes(' yoast ')),
      ).toBe(false);
    }
    const yoastcon = pages.findIndex((page) =>
      page.url.endsWith('/7-reasons-to-come-to-yoastcon/'),
    );
    expect(keywords[yoastcon][0].term).toBe('yoastcon');
  });
});
