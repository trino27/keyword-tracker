import {
  ISSUE_SOURCES as SOURCE,
  type ISeoIssueSource,
} from '../seo/seo-issue-catalogue.constant.js';
import type { TSeoIssueSeverity } from '../seo/seo-issue-severity.enum.js';

/**
 * A check of the SITE, judged once per crawl: robots.txt, the sitemap, the host and how
 * the server answers for a page that does not exist. Shaped like a page check — label,
 * hint, explanation, sources — so a reader meets one kind of finding, and kept in its
 * own catalogue because it has no page to belong to and no part in a page's score.
 */
export interface ISiteCheckDefinition {
  severity: TSeoIssueSeverity;
  label: string;
  hint: string;
  explanation: string;
  sources: readonly ISeoIssueSource[];
  /** Why the check can be skipped; every site check can, since its evidence may be missing. */
  skipReason: string;
}

const SITE_SOURCE = {
  unsupportedRobotsRules: {
    title:
      'Google Search Central Blog: A note on unsupported rules in robots.txt',
    url: 'https://developers.google.com/search/blog/2019/07/a-note-on-unsupported-rules-in-robotstxt',
  },
  httpStatusCodes: {
    title:
      'Google: How HTTP status codes, and network and DNS errors affect Google Search',
    url: 'https://developers.google.com/crawling/docs/troubleshooting/http-status-codes',
  },
} as const satisfies Record<string, ISeoIssueSource>;

export const SITE_CHECK_CATALOGUE = {
  ROBOTS_TXT_TRUNCATED: {
    severity: 'warning',
    label: 'robots.txt is past 500 KiB',
    hint: 'Shorten robots.txt: merge rules with wildcards and drop rules for paths that no longer exist.',
    explanation:
      'Google reads only the first 500 KiB of robots.txt and ignores everything after it, so every rule past that point does not exist for Googlebot — and a rule cut at the limit may read broader than it was written. This crawl read the file the same way. A robots.txt this large is almost always generated: one line per URL where one pattern would do.',
    sources: [SOURCE.robotsSpec, SOURCE.robotsRfc],
    skipReason: 'The site answered no robots.txt to measure.',
  },
  ROBOTS_TXT_UNSUPPORTED_RULES: {
    severity: 'notice',
    label: 'robots.txt rules Google does not support',
    hint: 'Remove noindex, nofollow and host lines from robots.txt; use a robots meta tag or X-Robots-Tag, and redirects, instead.',
    explanation:
      'robots.txt contains noindex:, nofollow: or host: lines. Google has never supported them and stopped honouring the undocumented noindex rule in 2019; host: was never part of the robots.txt standard Google follows. A site that relies on one of these believes pages are kept out of the index, or a host is chosen, when nothing of the sort happens. Keep pages out of the index with a robots meta tag or X-Robots-Tag, and choose a host with redirects.',
    sources: [SITE_SOURCE.unsupportedRobotsRules, SOURCE.blockIndexing],
    skipReason: 'The site answered no robots.txt to read.',
  },
  ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES: {
    severity: 'warning',
    label: "Googlebot's robots.txt group drops the general rules",
    hint: 'Repeat in the Googlebot group every rule from the * group that should apply to Google too.',
    explanation:
      "robots.txt has a group addressed to Googlebot, and the general User-agent: * group disallows paths that Googlebot's group does not. Google follows only the single most specific group that matches it, never a combination, so those paths are open to Googlebot however closed they are to everyone else. Usually the Googlebot group was added for one extra rule, in the belief that the general ones still applied.",
    sources: [SOURCE.robotsSpec],
    skipReason:
      'robots.txt has no group addressed to Googlebot, or no general group.',
  },
  SITEMAP_LISTS_NON_INDEXABLE: {
    severity: 'warning',
    label: 'Sitemap lists URLs that are not meant to be indexed',
    hint: 'List only URLs that answer 200, are indexable and name themselves as canonical.',
    explanation:
      'A sitemap is a list of the URLs you want in search results. Among the entries this crawl fetched, some redirect, answer an error, are set to noindex, or name another URL as canonical — each a contradiction between the sitemap and the page. Google asks for canonical URLs only, and a sitemap that keeps contradicting its pages is a sitemap search engines learn to trust less. Only the entries this crawl fetched are judged, so the count is a sample of the sitemap, not all of it.',
    sources: [SOURCE.sitemaps, SOURCE.canonical],
    skipReason: 'The crawl fetched no sitemap entry to judge.',
  },
  SITEMAP_LISTS_OTHER_HOST_VARIANTS: {
    severity: 'warning',
    label: 'Sitemap lists URLs on another protocol or host variant',
    hint: 'List every URL with the scheme and host the site serves — the one its pages declare as canonical.',
    explanation:
      'Some sitemap URLs use a different scheme or host variant than the one the site serves its pages from — http:// on an https site, the www host on a site served without it, or the reverse. Every one costs a redirect and tells Google a different URL is the main one than the pages themselves do. The usual cause is a generator that takes the host from configuration that was never updated after a move.',
    sources: [SOURCE.sitemaps, SOURCE.canonical],
    skipReason:
      'The crawl selected no sitemap, or crawled no page to learn the served host from.',
  },
  SITEMAP_LASTMOD_UNRELIABLE: {
    severity: 'notice',
    label: 'Sitemap lastmod dates look generated, not real',
    hint: 'Set lastmod to the date the page last changed significantly, not the date the sitemap was built.',
    explanation:
      "Google uses lastmod only if it is consistently and verifiably accurate, checking it against the page's own last modification. This sitemap's dates fail that: every entry carries the same date, or the dates are the moment the sitemap was generated, or they are older than the modification date the pages themselves declare. Once Google stops trusting a site's lastmod, updates are found only when it happens to recrawl.",
    sources: [SOURCE.sitemaps],
    skipReason: 'The sitemap gives too few lastmod dates to judge.',
  },
  HOST_VARIANT_SERVES_CONTENT: {
    severity: 'warning',
    label: 'Another host or protocol serves the site too',
    hint: 'Redirect every variant — http://, www or non-www — with a 301 to the one the site uses.',
    explanation:
      "The site's home page answers 200 at a second address — over http:// as well as https://, or at both the www and the bare host — instead of redirecting. Every page then exists twice, Google has to work out which copy to show, and links pointing at the other copy count for it rather than for yours. A server-side 301 to the address the site has chosen settles it.",
    sources: [SOURCE.canonical, SOURCE.redirects],
    skipReason: 'The crawl could not ask the other variants.',
  },
  HOST_REDIRECT_CHAIN: {
    severity: 'notice',
    label: 'Host redirects take more than one hop, or are temporary',
    hint: 'Redirect every variant straight to the final address in one permanent (301 or 308) hop.',
    explanation:
      'The other addresses of the site redirect, but not in one permanent step: they pass through an intermediate address (http:// → https:// → www), use a temporary 302 or 307, or end somewhere other than the address the site serves. Each hop is another request for readers and crawlers, and a temporary redirect tells Google to keep the old address as the one to show. Check all conditions in one rule and send the reader straight to the final URL.',
    sources: [SOURCE.redirects],
    skipReason: 'No other variant redirected.',
  },
  SOFT_404: {
    severity: 'warning',
    label: 'Missing pages answer 200 (soft 404)',
    hint: 'Answer a URL that does not exist with a real 404 or 410.',
    explanation:
      'The crawl asked for an address that cannot exist on the site, and the server answered 200 instead of 404. Google then has to judge from the content whether the page is real, reports it as a soft 404, and may index error pages at every mistyped or removed URL — while a real removal stays unclear. A 404 for a missing page does the site no harm; a 200 does.',
    sources: [SITE_SOURCE.httpStatusCodes],
    skipReason:
      'The crawl could not ask for a missing page (robots.txt forbids it, or there was no answer).',
  },
} as const satisfies Record<string, ISiteCheckDefinition>;

export type TSiteCheckCode = keyof typeof SITE_CHECK_CATALOGUE;

export const SITE_CHECK_CODES = Object.keys(
  SITE_CHECK_CATALOGUE,
) as TSiteCheckCode[];

/** What one crawl concluded about one site check. */
export const SITE_CHECK_STATUSES = [
  'passed',
  'failed',
  'notApplicable',
] as const;
export type TSiteCheckStatus = (typeof SITE_CHECK_STATUSES)[number];

/**
 * One site check's verdict for one crawl. `details` carries `evidence` — the robots.txt
 * lines, sitemap entries or answers the verdict rests on — on a failure.
 */
export interface ISiteCheckResult {
  code: TSiteCheckCode;
  status: TSiteCheckStatus;
  severity: TSeoIssueSeverity;
  details: Record<string, unknown>;
}
