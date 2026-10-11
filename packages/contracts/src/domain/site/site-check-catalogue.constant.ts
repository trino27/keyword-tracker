import { ISSUE_SOURCES as SOURCE } from '../seo/catalogue/crawl/crawl-catalogue.constant.js';
import type { ISeoIssueSource } from '../seo/catalogue/issue-definition.interface.js';
import type { IPlainCopy } from '../seo/plain-copy.interface.js';
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
  /** The finding in a marketer's words, as a page check carries it. */
  plain: IPlainCopy;
  hint: string;
  explanation: string;
  sources: readonly ISeoIssueSource[];
  /** Why the check can be skipped; every site check can, since its evidence may be missing. */
  skipReason: string;
}

const SITE_SOURCE = {
  // An industry measurement of AI crawlers' traffic, opened and read on 2026-10-11; cited
  // beside Google's own JavaScript guidance, which says Google renders the page.
  aiCrawlers: {
    title: 'Vercel: The rise of the AI crawler',
    url: 'https://vercel.com/blog/the-rise-of-the-ai-crawler',
  },
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
    plain: {
      what: 'Your robots.txt is so long that Google ignores the end of it',
      why: 'Google reads only the first 500 KiB of the file, so any rules after that point do not exist for Google, and a rule cut off at the limit may block more than intended.',
      fix: 'Ask your developer to shorten robots.txt by replacing one-line-per-page rules with a few broader patterns and removing rules for pages that no longer exist.',
    },
    hint: 'Shorten robots.txt: merge rules with wildcards and drop rules for paths that no longer exist.',
    explanation:
      'Google reads only the first 500 KiB of robots.txt and ignores everything after it, so every rule past that point does not exist for Googlebot — and a rule cut at the limit may read broader than it was written. This crawl read the file the same way. A robots.txt this large is almost always generated: one line per URL where one pattern would do.',
    sources: [SOURCE.robotsSpec, SOURCE.robotsRfc],
    skipReason: 'The site answered no robots.txt to measure.',
  },
  ROBOTS_TXT_UNSUPPORTED_RULES: {
    severity: 'notice',
    label: 'robots.txt rules Google does not support',
    plain: {
      what: 'Your robots.txt relies on rules Google ignores',
      why: 'Lines such as "noindex" in robots.txt have not worked in Google since 2019, so pages you think are hidden from search may be indexed, and a preferred domain set there is not actually set.',
      fix: 'Ask your developer to remove those lines and use the per-page search-visibility setting in your CMS or SEO plugin instead, plus redirects to choose the main domain.',
    },
    hint: 'Remove noindex, nofollow and host lines from robots.txt; use a robots meta tag or X-Robots-Tag, and redirects, instead.',
    explanation:
      'robots.txt contains noindex:, nofollow: or host: lines. Google has never supported them and stopped honouring the undocumented noindex rule in 2019; host: was never part of the robots.txt standard Google follows. A site that relies on one of these believes pages are kept out of the index, or a host is chosen, when nothing of the sort happens. Keep pages out of the index with a robots meta tag or X-Robots-Tag, and choose a host with redirects.',
    sources: [SITE_SOURCE.unsupportedRobotsRules, SOURCE.blockIndexing],
    skipReason: 'The site answered no robots.txt to read.',
  },
  ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES: {
    severity: 'warning',
    label: "Googlebot's robots.txt group drops the general rules",
    plain: {
      what: "Your robots.txt has a Google-only section that skips the site's general rules",
      why: 'Google follows only the section addressed to it, never the general one as well, so areas blocked for everyone else are open to Google. That section was usually added for one extra rule, assuming the general ones still applied.',
      fix: 'Ask your developer to copy into the Google section every general robots.txt rule that should apply to Google too.',
    },
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
    plain: {
      what: "The site's sitemap lists pages that aren't meant to be in search results",
      why: 'Some listed pages redirect, show errors, are hidden from search or point to another main version. Each contradicts the sitemap, and search engines learn to trust such a sitemap less. Based on a sample of the sitemap.',
      // No `fix`: removed at the user's request (plan D33); the why already says what is wrong.
    },
    hint: 'List only URLs that answer 200, are indexable and name themselves as canonical.',
    explanation:
      'A sitemap is a list of the URLs you want in search results. Among the entries this crawl fetched, some redirect, answer an error, are set to noindex, or name another URL as canonical — each a contradiction between the sitemap and the page. Google asks for canonical URLs only, and a sitemap that keeps contradicting its pages is a sitemap search engines learn to trust less. Only the entries this crawl fetched are judged, so the count is a sample of the sitemap, not all of it.',
    sources: [SOURCE.sitemaps, SOURCE.canonical],
    skipReason: 'The crawl fetched no sitemap entry to judge.',
  },
  SITEMAP_LISTS_OTHER_HOST_VARIANTS: {
    severity: 'warning',
    label: 'Sitemap lists URLs on another protocol or host variant',
    plain: {
      what: "The site's sitemap uses the wrong version of the site's address",
      why: 'Entries use http instead of https, or www when the site runs without it (or the reverse). Each costs a redirect and tells Google a different address is the main one than the pages themselves do.',
      fix: 'Ask your developer to update the site address in the sitemap generator or CMS settings; it is usually left over from a move to https or a new domain.',
    },
    hint: 'List every URL with the scheme and host the site serves its pages from.',
    explanation:
      'Some sitemap URLs use a different scheme or host variant than the one the site serves its pages from — http:// on an https site, the www host on a site served without it, or the reverse. Every one costs a redirect and tells Google a different URL is the main one than the pages themselves do. The usual cause is a generator that takes the host from configuration that was never updated after a move.',
    sources: [SOURCE.sitemaps, SOURCE.canonical],
    skipReason:
      'The crawl selected no sitemap, or crawled no page to learn the served host from.',
  },
  SITEMAP_LASTMOD_UNRELIABLE: {
    severity: 'notice',
    label: 'Sitemap lastmod dates look generated, not real',
    plain: {
      what: "The sitemap's last-updated dates don't look real",
      why: 'Google uses these dates only if they are consistently accurate. Once it stops trusting them, updates to your pages are found only when Google happens to recrawl, so refreshed content can take longer to show in search.',
      fix: 'Ask your developer, or check your sitemap plugin, so each date is when the page last changed meaningfully, not when the sitemap was generated.',
    },
    hint: 'Set lastmod to the date the page last changed significantly, not the date the sitemap was built.',
    explanation:
      "Google uses lastmod only if it is consistently and verifiably accurate, checking it against the page's own last modification. This sitemap's dates fail that: every entry carries the same date, or the dates are the moment the sitemap was generated, or they are older than the modification date the pages themselves declare. Once Google stops trusting a site's lastmod, updates are found only when it happens to recrawl.",
    sources: [SOURCE.sitemaps],
    skipReason: 'The sitemap gives too few lastmod dates to judge.',
  },
  HOST_VARIANT_SERVES_CONTENT: {
    severity: 'warning',
    label: 'Another host or protocol serves the site too',
    plain: {
      what: 'The site loads at two different addresses instead of redirecting',
      why: 'Every page then exists twice, Google has to decide which copy to show, and links pointing at the other copy count for it rather than for yours.',
      fix: 'Your hosting provider or developer can set a permanent (301) redirect from every other version, http or https, www or not, to the one address the site uses.',
    },
    hint: 'Redirect every variant — http://, www or non-www — with a 301 to the one the site uses.',
    explanation:
      "The site's home page answers 200 at a second address — over http:// as well as https://, or at both the www and the bare host — instead of redirecting. Every page then exists twice, Google has to work out which copy to show, and links pointing at the other copy count for it rather than for yours. A server-side 301 to the address the site has chosen settles it.",
    sources: [SOURCE.canonical, SOURCE.redirects],
    skipReason: 'The crawl could not ask the other variants.',
  },
  HOST_REDIRECT_CHAIN: {
    severity: 'notice',
    label: 'Host redirects form a chain, or are temporary',
    plain: {
      what: "The site's other addresses redirect in too many steps, or only temporarily",
      why: 'Each extra step slows visitors and crawlers, and a temporary redirect tells Google to keep showing the old address. Two permanent steps are fine and are not reported here.',
      fix: 'Ask your developer or hosting provider to send every version of the address straight to the final one in a single permanent redirect.',
    },
    hint: 'Redirect every variant straight to the final address in one permanent (301 or 308) hop.',
    explanation:
      'The other addresses of the site redirect, but badly: through three hops or more before they reach the address the site serves, with a temporary 302 or 307 on the way, or to somewhere else entirely. Each hop is another request for readers and crawlers, and a temporary redirect tells Google to keep the old address as the one to show. Two permanent hops (http:// → https:// → the canonical host) are not reported: more than half the sites measured do exactly that, and Google follows them without loss. What the home page does once the host is right — a redirect to a language version — is not counted. Check all conditions in one rule and send the reader straight to the final URL.',
    sources: [SOURCE.redirects],
    skipReason: 'No other variant redirected.',
  },
  SOFT_404: {
    severity: 'warning',
    label: 'Missing pages answer 200 (soft 404)',
    plain: {
      what: 'The site answers missing pages as if they exist',
      why: 'Addresses that do not exist return a normal page, so Google has to guess, may index error pages at mistyped or removed addresses, and removed pages do not clearly drop out. A proper "not found" answer does no harm.',
      fix: 'Ask your developer or hosting provider to make the server answer a real "404 not found" for pages that do not exist; a theme or plugin may be overriding it.',
    },
    hint: 'Answer a URL that does not exist with a real 404 or 410.',
    explanation:
      'The crawl asked for an address that cannot exist on the site, and the server answered 200 instead of 404. Google then has to judge from the content whether the page is real, reports it as a soft 404, and may index error pages at every mistyped or removed URL — while a real removal stays unclear. A 404 for a missing page does the site no harm; a 200 does.',
    sources: [SITE_SOURCE.httpStatusCodes],
    skipReason:
      'The crawl could not ask for a missing page (robots.txt forbids it, or there was no answer).',
  },
  FAVICON_INVALID: {
    // A warning: the icon sits beside every result from the site, and a default one in
    // its place is visible on every search the site appears in.
    severity: 'warning',
    label: 'Favicon Google cannot show',
    plain: {
      what: "Google cannot use your site's icon, so results show a generic one",
      why: 'Google shows the site icon beside every result from it. When the icon is missing, blocked, broken or in a format Google does not read, a plain default icon appears instead, which makes your results easier to overlook.',
      fix: 'Ask your developer to declare a square PNG or ICO icon of at least 48 pixels on the home page and keep it open to Google in robots.txt; most CMS themes have a site icon setting.',
    },
    hint: 'Declare a square PNG, ICO or GIF favicon with <link rel="icon"> on the home page, crawlable by Googlebot-Image.',
    explanation:
      'Google shows a favicon beside every result from the site and reads it from a <link rel="icon"> (or apple-touch-icon) on the home page. Its requirements: a format it supports — BMP, GIF, ICO, PNG, JPEG, PPM or TIFF, so an SVG-only icon is not used — a square of at least 8×8 px, and a file Googlebot-Image may crawl. The check reads the home page\'s icon links, asks robots.txt about the first one in a supported format, fetches it and reads its size from the file. Failing any requirement, Google shows a default icon instead; it recommends more than 48×48 px so the icon looks good everywhere.',
    sources: [SOURCE.favicon],
    skipReason: 'The crawl could not read the home page.',
  },
  SITE_NAME_NOT_DECLARED: {
    severity: 'notice',
    label: 'No site name declared for Google',
    plain: {
      what: 'The home page does not tell Google what your site is called',
      why: 'Google shows a site name above every result. Without a declared name it picks one from the page, sometimes the domain or a slogan, and searchers may not recognise your brand.',
      fix: 'An SEO plugin such as Yoast SEO adds this from the site title setting; otherwise ask your developer to add WebSite markup with the site name to the home page.',
    },
    hint: 'Add WebSite structured data with name (and alternateName) to the home page.',
    explanation:
      "The home page carries no WebSite structured data with a name. Google's site name documentation names that markup as the way to state the name it shows above results, beside og:site_name, the title and the headings, which it also reads. It is optional — Google picks a name anyway — but the declared one is the strongest hint, and alternateName offers the variants (an acronym, a shorter form) Google may use instead.",
    sources: [SOURCE.siteNames],
    skipReason: 'The crawl could not read the home page.',
  },
  SITE_NAME_INCONSISTENT: {
    severity: 'notice',
    label: 'Site name differs between home page sources',
    plain: {
      what: 'Your home page gives Google two different names for the site',
      why: 'Google picks the site name shown above every result from the home page and asks for one name used consistently. Given two, it may pick the one you did not intend.',
      fix: "Ask your developer, or check your SEO plugin's site name settings, so the site name markup and the sharing name match, or the other is listed as an alternate name.",
    },
    hint: 'Make WebSite name and og:site_name the same, or list one as alternateName.',
    explanation:
      "The home page's WebSite structured data names the site one way and its og:site_name another, and neither appears among the markup's alternateName values. Google's site name documentation says it reads both, and asks for the same name to be used consistently across the home page and its structured data. Letter case, spacing and punctuation are ignored in the comparison.",
    sources: [SOURCE.siteNames],
    skipReason:
      'The home page lacks WebSite markup with a name, or an og:site_name, to compare.',
  },
  CONTENT_NEEDS_JAVASCRIPT: {
    // A notice: Google renders JavaScript and indexes such posts; the cost is to AI
    // assistants' search crawlers, which do not (plan D8).
    severity: 'notice',
    label: 'Posts need JavaScript to show their text',
    plain: {
      what: "Some posts show no text until the browser runs the site's scripts",
      why: 'Google runs the scripts and sees the post, so rankings are not the issue. The crawlers behind ChatGPT, Claude and Perplexity do not run them: to those assistants the post is empty, so they cannot quote it or link to it in their answers.',
      fix: 'Ask your developer to render posts on the server or as static pages (most frameworks have a setting for it), so the text is in the HTML the server sends.',
    },
    hint: 'Serve the text of each post in its HTML: server-side or static rendering.',
    explanation:
      "Among the posts this crawl read, some arrived as an empty shell — an application root with no text, or a notice asking for JavaScript — with the content drawn by scripts in the browser. This crawler runs no scripts, so it skipped them; the finding names them. Google renders JavaScript and can index such pages, at the cost of a second, deferred rendering pass. The search crawlers of AI assistants do not: Vercel's measurement of their traffic found that none of the major ones — OpenAI's, Anthropic's and Perplexity's among them — executes JavaScript, so a client-rendered post is invisible to them. Server-side or static rendering puts the text in the HTML for every reader.",
    sources: [SOURCE.javascriptSeo, SITE_SOURCE.aiCrawlers],
    skipReason: 'The crawl read no post to judge.',
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
