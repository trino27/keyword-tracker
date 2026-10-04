/*
 * Re-requiring modules is the point of this file: an arm has to read the scoring
 * constants as its own, and an ES import is bound once per test file. The unsafe-any
 * rules are off for the same reason — `jest.requireActual` has no type to give.
 */
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const FIX = join(__dirname, '../../../../test/fixtures/sites');

export interface IPageRef {
  site: string;
  siteKey: string;
  slug: string;
  url: string;
  html: string;
}

/** Listing pages, feeds and sitemaps are not articles and carry no keywords. */
const NOT_AN_ARTICLE = new Set(['feed', 'sitemap', 'seo-blog', '__root__']);

function pagesOf(
  site: string,
  siteKey: string,
  base: string,
  dir: string,
): IPageRef[] {
  const root = join(FIX, site, dir);
  const out: IPageRef[] = [];
  for (const slug of readdirSync(root)) {
    const path = join(root, slug);
    if (!statSync(path).isDirectory()) continue;
    const file = join(path, 'index.html');
    if (!existsSync(file) || NOT_AN_ARTICLE.has(slug)) continue;
    out.push({
      site,
      siteKey,
      slug,
      url: `${base}${slug}/`,
      html: readFileSync(file, 'utf8'),
    });
  }
  return out;
}

export function corpus(): IPageRef[] {
  return [
    ...pagesOf(
      'semrush',
      'semrush.com',
      'https://www.semrush.com/blog/',
      'blog',
    ),
    ...pagesOf('yoast', 'yoast.com', 'https://yoast.com/', '.'),
  ];
}

export interface IRunRow {
  site: string;
  slug: string;
  words: number;
  keywords: { term: string; relevance: number }[];
}

/**
 * Runs the real pipeline with `overrides` applied to the scoring constants. Modules are
 * re-required per arm so the constants are read at their real import sites.
 */
export async function runArm(
  overrides: Record<string, unknown>,
): Promise<IRunRow[]> {
  type TParsed = { url: string; parsed: { wordCount: number } };
  type TExtract = (
    pages: TParsed[],
    siteKey: string,
  ) => Promise<{ term: string; relevance: number }[][]>;
  type TParse = (html: string, url: string) => { wordCount: number };
  let extract: TExtract = () => Promise.resolve([]);
  const batches: { site: string; pages: IPageRef[]; parsed: TParsed[] }[] = [];

  // `isolateModules` takes a SYNCHRONOUS callback, so it can only require the modules
  // and parse the HTML; the pipeline is awaited after it returns. The function it
  // handed back keeps the module registry this arm required, mocked constants and all.
  jest.isolateModules(() => {
    jest.doMock('../constants/keyword-scoring.constant', () => {
      const actual = jest.requireActual(
        '../constants/keyword-scoring.constant',
      );
      return { ...actual, ...overrides };
    });
    const { extractPage } = require('../services/html-extraction/extract-page');
    const parse = extractPage as TParse;
    const {
      extractKeywords,
    } = require('../services/keyword-extraction/extract-keywords/extract-keywords');
    extract = extractKeywords;
    const all = corpus();
    for (const site of ['semrush', 'yoast']) {
      const pages = all.filter((page) => page.site === site);
      if (pages.length === 0) continue;
      batches.push({
        site,
        pages,
        parsed: pages.map((page) => ({
          url: page.url,
          parsed: parse(page.html, page.url),
        })),
      });
    }
  });

  const rows: IRunRow[] = [];
  for (const { site, pages, parsed } of batches) {
    const keywords = await extract(parsed, pages[0].siteKey);
    pages.forEach((page, index) => {
      rows.push({
        site,
        slug: page.slug,
        words: parsed[index].parsed.wordCount,
        keywords: keywords[index].map((keyword) => ({
          term: keyword.term,
          relevance: keyword.relevance,
        })),
      });
    });
  }
  return rows;
}
