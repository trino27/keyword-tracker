import { evidence } from '../checks/_shared/evidence';
import {
  SITE_NOT_APPLICABLE,
  SITE_PASS,
  type IFetchedEntry,
  type TSiteCheck,
} from './site-check.interface';

const originOf = (url: string) => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

/**
 * Answers that refuse this crawler rather than describe the page: authentication, a
 * ban, pay-per-crawl, a rate limit, a bot challenge. allrecipes.com (402),
 * netflixtechblog.com (403) and css-tricks.com (429) were reported for listing pages
 * that do not answer — they answer Googlebot; they turned this crawler away (2026-10).
 */
const REFUSALS = new Set([401, 402, 403, 429]);
const isRefusal = (entry: IFetchedEntry) =>
  (entry.httpStatus !== null && REFUSALS.has(entry.httpStatus)) ||
  entry.reason === 'Bot challenge';

/** Why one fetched sitemap entry is not a URL to index, or null when it is. */
function contradictionOf(entry: IFetchedEntry): string | null {
  if (entry.status === 'skipped_robots') return 'disallowed by robots.txt';
  if (entry.reason?.startsWith('Soft 404')) return 'a soft 404';
  if (entry.status === 'skipped_other_site' && entry.httpStatus !== null)
    return 'redirects off the site';
  if (
    entry.status === 'failed' &&
    entry.httpStatus !== null &&
    entry.httpStatus >= 400
  )
    return `answers HTTP ${entry.httpStatus}`;
  const issues = entry.page?.issues ?? [];
  const issue = (code: string) => issues.find((found) => found.code === code);
  const redirected = issue('REDIRECTED');
  if (redirected) return `redirects to ${String(redirected.details.to)}`;
  if (issue('NOINDEX')) return 'is set to noindex';
  const canonical = issue('CANONICAL_MISMATCH');
  if (canonical)
    return `names ${String(canonical.details.canonical)} as canonical`;
  return null;
}

/**
 * Sitemap entries this crawl fetched that are not meant to be indexed: an error, a
 * redirect, noindex, another canonical, a robots.txt disallow, a soft 404. A sample —
 * the crawl fetches at most thirty entries — said as one.
 */
export const sitemapListsNonIndexable: TSiteCheck = (input) => {
  const fetched = input.fetched.filter(
    (entry) =>
      (entry.status === 'skipped_robots' || entry.httpStatus !== null) &&
      !isRefusal(entry),
  );
  if (fetched.length === 0) return SITE_NOT_APPLICABLE;
  const found = fetched
    .map((entry) => ({ url: entry.url, why: contradictionOf(entry) }))
    .filter(
      (entry): entry is { url: string; why: string } => entry.why !== null,
    );
  return found.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: {
          count: found.length,
          sampled: fetched.length,
          evidence: evidence([
            `${found.length} of the ${fetched.length} sitemap entries this crawl fetched:`,
            ...found.map(({ url, why }) => `${url} — ${why}`),
          ]),
        },
      };
};

/** Sitemap URLs whose scheme or host is not the one the site's pages are served from. */
export const sitemapListsOtherHostVariants: TSiteCheck = (input) => {
  if (!input.servedOrigin || input.sitemapUrls.length === 0)
    return SITE_NOT_APPLICABLE;
  const others = input.sitemapUrls.filter((url) => {
    const origin = originOf(url);
    return origin !== null && origin !== input.servedOrigin;
  });
  return others.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: {
          count: others.length,
          total: input.sitemapUrls.length,
          servedOrigin: input.servedOrigin,
          evidence: evidence([
            `The site serves its pages from ${input.servedOrigin}; ${others.length} of ${input.sitemapUrls.length} sitemap URLs do not:`,
            ...others,
          ]),
        },
      };
};

/** Fewer dated entries than this say nothing about how the dates are produced. */
const MIN_DATED = 5;
/** A lastmod this close to the crawl, on most entries, is the sitemap's build time. */
const GENERATED_WINDOW_MS = 2 * 60 * 60 * 1000;
const GENERATED_SHARE = 0.8;
/** Slack for a lastmod written as a date against a modification written as a time. */
const DAY_MS = 24 * 60 * 60 * 1000;
/** Pages whose own date contradicts the sitemap, before the sitemap is called wrong. */
const MIN_CONTRADICTED = 3;

/**
 * Whether the sitemap's lastmod could be what Google asks it to be — the last
 * significant change of each page. Three patterns say it is not: every entry dated
 * alike, nearly every entry dated at the moment of the crawl (the sitemap stamps its
 * build time), or entries dated before the modification their own pages declare.
 */
export const sitemapLastmodUnreliable: TSiteCheck = (input) => {
  const dated = input.sitemapUrls
    .map((url) => ({ url, lastmod: input.lastmods[url] }))
    .filter(
      (entry): entry is { url: string; lastmod: string } => !!entry.lastmod,
    );
  if (dated.length < MIN_DATED) return SITE_NOT_APPLICABLE;
  const found: string[] = [];

  const distinct = new Set(dated.map(({ lastmod }) => lastmod));
  if (distinct.size === 1)
    found.push(
      `All ${dated.length} dated entries carry the same lastmod: ${dated[0].lastmod}`,
    );

  const crawled = input.crawledAt.getTime();
  const timed = dated.filter(({ lastmod }) => lastmod.includes('T'));
  const recent = timed.filter(({ lastmod }) => {
    const at = Date.parse(lastmod);
    return !Number.isNaN(at) && Math.abs(crawled - at) <= GENERATED_WINDOW_MS;
  });
  if (
    timed.length >= MIN_DATED &&
    recent.length >= timed.length * GENERATED_SHARE
  )
    found.push(
      `${recent.length} of ${timed.length} lastmod times fall within two hours of the crawl — the moment the sitemap was built`,
    );

  const contradicted = input.fetched.flatMap((entry) => {
    const lastmod = input.lastmods[entry.url];
    const modified = entry.page?.dateModified;
    if (!lastmod || !modified) return [];
    const sitemapAt = Date.parse(lastmod);
    const pageAt = Date.parse(modified);
    if (Number.isNaN(sitemapAt) || Number.isNaN(pageAt)) return [];
    return [
      { url: entry.url, lastmod, modified, older: sitemapAt + DAY_MS < pageAt },
    ];
  });
  const older = contradicted.filter(({ older: isOlder }) => isOlder);
  if (
    older.length >= MIN_CONTRADICTED &&
    older.length * 2 >= contradicted.length
  )
    found.push(
      ...older.map(
        ({ url, lastmod, modified }) =>
          `${url} — sitemap lastmod ${lastmod}, the page says it was modified ${modified}`,
      ),
    );

  return found.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: { dated: dated.length, evidence: evidence(found) },
      };
};
