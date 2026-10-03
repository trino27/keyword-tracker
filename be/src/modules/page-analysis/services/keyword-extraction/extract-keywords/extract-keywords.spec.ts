import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  FIXTURES_ROOT,
  loadFixtureManifest,
} from '@infrastructure/remote-api/_testing/fixture-http-transport';
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

  it('gives every page 5–8 keywords, the top at relevance 1', () => {
    expect(keywords).toHaveLength(15);
    for (const pageKeywords of keywords) {
      expect(pageKeywords.length).toBeGreaterThanOrEqual(5);
      expect(pageKeywords.length).toBeLessThanOrEqual(8);
      expect(pageKeywords[0].relevance).toBe(1);
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

  it('never puts the brand word in any top 3 ("yoastcon", an event, is a topic)', () => {
    for (const pageKeywords of keywords) {
      expect(
        pageKeywords
          .slice(0, 3)
          .some((keyword) => ` ${keyword.term} `.includes(' yoast ')),
      ).toBe(false);
    }
  });
});
