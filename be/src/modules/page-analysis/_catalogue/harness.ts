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
export function runArm(overrides: Record<string, unknown>): IRunRow[] {
  let rows: IRunRow[] = [];
  jest.isolateModules(() => {
    jest.doMock('../constants/keyword-scoring.constant', () => {
      const actual = jest.requireActual(
        '../constants/keyword-scoring.constant',
      );
      return { ...actual, ...overrides };
    });
    /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    const { extractPage } = require('../services/html-extraction/extract-page');
    const {
      extractKeywords,
    } = require('../services/keyword-extraction/extract-keywords/extract-keywords');
    const all = corpus();
    rows = [];
    for (const site of ['semrush', 'yoast']) {
      const pages = all.filter((p) => p.site === site);
      if (pages.length === 0) continue;
      const parsed = pages.map((p) => ({
        url: p.url,
        parsed: extractPage(p.html, p.url),
      }));
      const keywords = extractKeywords(parsed, pages[0].siteKey);
      pages.forEach((p, i) => {
        rows.push({
          site,
          slug: p.slug,
          words: parsed[i].parsed.wordCount,
          keywords: keywords[i].map(
            (k: { term: string; relevance: number }) => ({
              term: k.term,
              relevance: k.relevance,
            }),
          ),
        });
      });
    }
  });
  return rows;
}
