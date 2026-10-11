import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';
import type { TIssueOwner } from './issue-owner.enum.js';
import type { IPlainCopy } from './plain-copy.interface.js';
import { CWV_THRESHOLDS } from '../page-speed/cwv-thresholds.constant.js';

/** A page that backs a check's claim, named for the reader as its publisher names it. */
export interface ISeoIssueSource {
  title: string;
  url: string;
}

export interface ISeoIssueDefinition {
  /**
   * The one process that writes findings under this code, and the only one whose replace
   * may delete them. Required, so an entry cannot be added without saying who clears it.
   */
  owner: TIssueOwner;
  severity: TSeoIssueSeverity;
  /** Short, shown as the issue's name. */
  label: string;
  /**
   * The finding in a marketer's words — what is wrong, what it costs, who fixes it. Required,
   * so an entry cannot be added without the version its reader acts on.
   */
  plain: IPlainCopy;
  /** One sentence on what to do. */
  hint: string;
  /**
   * What the check looks at, why it matters and to whom, and what fixes it — including,
   * where it is true, that Google does NOT use the signal. Several sentences, because a
   * finding a reader cannot weigh is a finding they cannot act on, and a catalogue that
   * overstates its case manufactures urgency.
   */
  explanation: string;
  /** Where the explanation's claims come from: at least one, first-party wherever one exists. */
  sources: readonly ISeoIssueSource[];
  /** Inclusive bounds of the acceptable value, where the rule has one. */
  min?: number;
  max?: number;
  /**
   * Why this check can be skipped, for the codes whose rule can answer `notApplicable`.
   * A property of the RULE, not of a page — `IMAGES_MISSING_ALT` is skipped for one
   * reason every time — so it is a constant here rather than a fact stored per page.
   * Its presence is what `CONDITIONAL_ISSUE_CODES` reads.
   */
  skipReason?: string;
  /**
   * `false` takes the check out of circulation without removing its code. Removing the
   * code is not an option: a page crawled while the check ran keeps it in
   * `checks_judged` and may hold a finding under it, and both are read back through
   * this catalogue — a missing entry would fail the gateway's own validation of data it
   * stored itself. Absent means the ordinary thing: the check runs.
   */
  enabled?: false;
  /**
   * `run` marks a check that cannot be answered from one page — it compares the page
   * with the others crawled in the same run. Absent means the ordinary thing: the
   * page judges itself.
   */
  scope?: 'run';
}

/**
 * Where the catalogue's claims come from. First-party documentation wherever it exists —
 * Google Search Central for what Google does, MDN, the W3C and the RFCs for what the web
 * platform means — and an industry source only where no first party has written about
 * the subject at all. Every URL was opened and its text read against the claim it backs
 * on 2026-10-09; a redirect was followed and the final address kept.
 */
export const ISSUE_SOURCES = {
  titleLinks: {
    title: 'Google Search Central: Influencing your title links',
    url: 'https://developers.google.com/search/docs/appearance/title-link',
  },
  snippets: {
    title: 'Google Search Central: Control your snippets in search results',
    url: 'https://developers.google.com/search/docs/appearance/snippet',
  },
  starterGuide: {
    title: 'Google Search Central: SEO Starter Guide',
    url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
  },
  mdnHeadings: {
    title: 'MDN: <h1>–<h6> heading elements',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/Heading_Elements',
  },
  canonical: {
    title: 'Google Search Central: How to specify a canonical URL',
    url: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },
  canonicalRfc: {
    title: 'RFC 6596: The Canonical Link Relation',
    url: 'https://www.rfc-editor.org/rfc/rfc6596.html',
  },
  blockIndexing: {
    title: 'Google Search Central: Block Search indexing with noindex',
    url: 'https://developers.google.com/search/docs/crawling-indexing/block-indexing',
  },
  robotsMeta: {
    title:
      'Google Search Central: Robots meta tag and X-Robots-Tag specifications',
    url: 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag',
  },
  robotsIntro: {
    title: 'Google Search Central: Introduction to robots.txt',
    url: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
  },
  robotsSpec: {
    title: 'Google: How Google interprets the robots.txt specification',
    url: 'https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec',
  },
  robotsRfc: {
    title: 'RFC 9309: Robots Exclusion Protocol',
    url: 'https://www.rfc-editor.org/rfc/rfc9309.html',
  },
  javascriptSeo: {
    title: 'Google Search Central: JavaScript SEO basics',
    url: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
  },
  images: {
    title: 'Google Search Central: Google image SEO best practices',
    url: 'https://developers.google.com/search/docs/appearance/google-images',
  },
  waiImages: {
    title: 'W3C WAI: Images tutorial',
    url: 'https://www.w3.org/WAI/tutorials/images/',
  },
  helpfulContent: {
    title:
      'Google Search Central: Creating helpful, reliable, people-first content',
    url: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },
  crawlableLinks: {
    title: 'Google Search Central: Link best practices for Google',
    url: 'https://developers.google.com/search/docs/crawling-indexing/links-crawlable',
  },
  qualifyLinks: {
    title: 'Google Search Central: Qualify your outbound links to Google',
    url: 'https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links',
  },
  urlStructure: {
    title: 'Google Search Central: URL structure best practices',
    url: 'https://developers.google.com/search/docs/crawling-indexing/url-structure',
  },
  multiRegional: {
    title:
      'Google Search Central: Managing multi-regional and multilingual sites',
    url: 'https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites',
  },
  wcagLanguage: {
    title: 'W3C WCAG 2.2: Understanding Language of Page',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html',
  },
  hreflang: {
    title:
      'Google Search Central: Tell Google about localized versions of your page',
    url: 'https://developers.google.com/search/docs/specialty/international/localized-versions',
  },
  mobileFirst: {
    title: 'Google Search Central: Mobile-first indexing best practices',
    url: 'https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing',
  },
  mdnViewport: {
    title: 'MDN: <meta name="viewport">',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport',
  },
  openGraph: {
    title: 'The Open Graph protocol',
    url: 'https://ogp.me/',
  },
  httpsSignal: {
    title: 'Google Search Central Blog: HTTPS as a ranking signal',
    url: 'https://developers.google.com/search/blog/2014/08/https-as-ranking-signal',
  },
  enableHttps: {
    title: 'web.dev: Enable HTTPS',
    url: 'https://web.dev/articles/enable-https',
  },
  mixedContent: {
    title: 'web.dev: What is mixed content?',
    url: 'https://web.dev/articles/what-is-mixed-content',
  },
  mdnMixedContent: {
    title: 'MDN: Mixed content',
    url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content',
  },
  redirects: {
    title: 'Google Search Central: Redirects and Google Search',
    url: 'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
  },
  sitemaps: {
    title: 'Google Search Central: Build and submit a sitemap',
    url: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap',
  },
  googlebot: {
    title: 'Google Search Central: Googlebot',
    url: 'https://developers.google.com/search/docs/crawling-indexing/googlebot',
  },
  googleCrawlers: {
    title: "Google: Overview of Google's crawlers and fetchers",
    url: 'https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers',
  },
  mdnCompression: {
    title: 'MDN: Compression in HTTP',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression',
  },
  cannibalisation: {
    title: 'Ahrefs: Keyword cannibalization',
    url: 'https://ahrefs.com/blog/keyword-cannibalization/',
  },
  // Opened and read on 2026-10-11 for the checks drawn from Ahrefs' recommendations; an
  // industry source, so a check backed by it alone is at most a notice (plan D1).
  ahrefsOnPage: {
    title: 'Ahrefs: On-page SEO',
    url: 'https://ahrefs.com/blog/on-page-seo/',
  },
  articleMarkup: {
    title: 'Google Search Central: Article structured data',
    url: 'https://developers.google.com/search/docs/appearance/structured-data/article',
  },
  aiFeatures: {
    title: 'Google Search Central: AI features and your website',
    url: 'https://developers.google.com/search/docs/appearance/ai-features',
  },
  openAiBots: {
    title: 'OpenAI: Overview of OpenAI crawlers',
    url: 'https://developers.openai.com/api/docs/bots',
  },
  perplexityBots: {
    title: 'Perplexity: Perplexity crawlers',
    url: 'https://docs.perplexity.ai/docs/resources/perplexity-crawlers',
  },
  bingCrawlers: {
    title: 'Bing Webmaster Tools: Which crawlers does Bing use?',
    url: 'https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0',
  },
  spamPolicies: {
    title: 'Google Search Central: Spam policies for Google web search',
    url: 'https://developers.google.com/search/docs/essentials/spam-policies',
  },
  bylineDates: {
    title: 'Google Search Central: Influence your byline dates',
    url: 'https://developers.google.com/search/docs/appearance/publication-dates',
  },
  structuredDataPolicies: {
    title: 'Google Search Central: General structured data guidelines',
    url: 'https://developers.google.com/search/docs/appearance/structured-data/sd-policies',
  },
  wcagLinkPurpose: {
    title: 'W3C WCAG 2.2: Understanding Link Purpose (In Context)',
    url: 'https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html',
  },
  htmlCharset: {
    title: "WHATWG HTML Standard: Specifying the document's character encoding",
    url: 'https://html.spec.whatwg.org/multipage/semantics.html',
  },
  mdnMeta: {
    title: 'MDN: <meta>: the metadata element',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta',
  },
  controlSharing: {
    title: 'Google Search Central: Control what you share with Google',
    url: 'https://developers.google.com/search/docs/crawling-indexing/control-what-you-share',
  },
  coreWebVitals: {
    title:
      'Google Search Central: Understanding Core Web Vitals and Google search results',
    url: 'https://developers.google.com/search/docs/appearance/core-web-vitals',
  },
  optimizeLcp: {
    title: 'web.dev: Optimize Largest Contentful Paint',
    url: 'https://web.dev/articles/optimize-lcp',
  },
  lcpLazyLoading: {
    title: 'web.dev: The performance effects of too much lazy loading',
    url: 'https://web.dev/articles/lcp-lazy-loading',
  },
  mdnScript: {
    title: 'MDN: <script>: the Script element',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script',
  },
  mdnPreload: {
    title: 'MDN: rel=preload',
    url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload',
  },
  bfcache: {
    title: 'web.dev: Back/forward cache',
    url: 'https://web.dev/articles/bfcache',
  },
  domSize: {
    title: 'web.dev: How large DOM sizes affect interactivity',
    url: 'https://web.dev/articles/dom-size-and-interactivity',
  },
  structuredDataIntro: {
    title: 'Google Search Central: Introduction to structured data markup',
    url: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
  },
  // The five below back the Core Web Vitals entries; opened and read on 2026-10-10.
  lcp: {
    title: 'web.dev: Largest Contentful Paint (LCP)',
    url: 'https://web.dev/articles/lcp',
  },
  inp: {
    title: 'web.dev: Interaction to Next Paint (INP)',
    url: 'https://web.dev/articles/inp',
  },
  cls: {
    title: 'web.dev: Cumulative Layout Shift (CLS)',
    url: 'https://web.dev/articles/cls',
  },
  pageSpeedInsights: {
    title: 'Google for Developers: About PageSpeed Insights',
    url: 'https://developers.google.com/speed/docs/insights/v5/about',
  },
  pageExperience: {
    title:
      'Google Search Central: Understanding page experience in Google Search results',
    url: 'https://developers.google.com/search/docs/appearance/page-experience',
  },
  // The four below back Claude-SearchBot and the content checks drawn from Productive
  // Shop's audit and AI-search guidance; opened and read on 2026-10-11. The three
  // Productive Shop pages are industry sources, cited where no first party gives a number.
  claudeBots: {
    title:
      'Claude Help Center: Does Anthropic crawl data from the web, and how can site owners block the crawler?',
    url: 'https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler',
  },
  productiveShopAudit: {
    title:
      'Productive Shop: Essential enterprise SEO audit for B2B websites [checklist]',
    url: 'https://productiveshop.com/resources/blog/seo-audit-checklist/',
  },
  productiveShopAiSearch: {
    title:
      'Productive Shop: How do AI overviews and AI answer engines impact organic traffic?',
    url: 'https://productiveshop.com/resources/blog/ai-saas-search-trends/',
  },
  productiveShopGeo: {
    title: 'Productive Shop: Generative engine optimization services',
    url: 'https://productiveshop.com/generative-engine-optimization-services/',
  },
  // The five below back the checks from Google's Search Appearance guides; opened and
  // read on 2026-10-11.
  discover: {
    title: 'Google Search Central: Discover and your website',
    url: 'https://developers.google.com/search/docs/appearance/google-discover',
  },
  breadcrumbMarkup: {
    title: 'Google Search Central: Breadcrumb (BreadcrumbList) structured data',
    url: 'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb',
  },
  video: {
    title: 'Google Search Central: Video SEO best practices',
    url: 'https://developers.google.com/search/docs/appearance/video',
  },
  favicon: {
    title: 'Google Search Central: Define a favicon to show in search results',
    url: 'https://developers.google.com/search/docs/appearance/favicon-in-search',
  },
  siteNames: {
    title: 'Google Search Central: Provide a site name to Google Search',
    url: 'https://developers.google.com/search/docs/appearance/site-names',
  },
} as const satisfies Record<string, ISeoIssueSource>;

const SOURCE = ISSUE_SOURCES;

/**
 * THIN_CONTENT's line. Below it a post is short, and the checks that ask how a long text
 * is built — sections, images, sources — do not judge it: a 150-word note needs none.
 */
const LONG_TEXT_WORDS = 300;

/**
 * Every SEO issue the tracker can report — the crawl's checks are typed by the
 * crawl-owned keys, so a code without a check does not compile; the PageSpeed worker
 * writes the speed-owned ones; and the frontend renders labels and hints from here.
 * Thresholds live here too: the check and the screen quote one number.
 */
export const SEO_ISSUE_CATALOGUE = {
  TITLE_MISSING: {
    owner: 'crawl',
    severity: 'error',
    label: 'Title is missing',
    plain: {
      what: 'This page has no title for search results',
      why: 'Google then writes a headline itself from text on the page, which often describes the page worse and earns fewer clicks.',
      fix: 'Add a page title in your CMS (usually an "SEO title" field), or ask your developer to add one to the page template.',
    },
    hint: 'Search results show the title as the headline; add a <title> in <head>.',
    explanation:
      'The <title> element is the first source Google reads for the headline of a search result (its "title link"). Without one, Google builds the headline itself from headings, anchor text or other text on the page, and the result may not say what the page is about. Google asks for a title on every page, written to describe that page specifically.',
    sources: [SOURCE.titleLinks],
  },
  TITLE_LENGTH: {
    // A notice, not a warning: exceeding the bounds costs space in a result, it does not
    // break the page (plan D4). The numbers are unchanged; industry consensus confirms them.
    owner: 'crawl',
    severity: 'notice',
    label: 'Title length',
    plain: {
      what: 'The page title is too long or too short for search results',
      why: 'Long titles get cut off mid-phrase in Google, and very short ones often leave out what makes the page worth clicking. Google sets no fixed limit, so treat this as a prompt to reread the title, not a rule.',
      fix: "In your CMS's SEO title field, the writer or editor can aim for roughly 30–60 characters that say specifically what this page offers.",
    },
    hint: 'Titles outside 30–60 characters are cut off or waste the space in results.',
    explanation:
      "Google does not publish a length limit; it truncates a title link to fit the width of the result, and asks for titles that are descriptive and concise rather than vague or stuffed. The 30–60 character range is the audit industry's working approximation of that width: longer titles tend to be cut mid-phrase, and very short ones often leave out what distinguishes the page. Treat this as a prompt to reread the title, not as a rule Google enforces.",
    sources: [SOURCE.titleLinks],
    min: 30,
    max: 60,
    skipReason: 'No title to measure.',
  },
  TITLE_SCRIPT_MISMATCH: {
    // A notice: Google rewrites the title link, it does not demote the page. Only a title
    // with NO letter of the page's script is reported, because a Russian post titled
    // "Google Analytics: полное руководство" mixes scripts on purpose and rightly.
    owner: 'crawl',
    severity: 'notice',
    label: 'Title is in another script than the page',
    plain: {
      what: "The page's title is written in a different alphabet from its text",
      why: 'Google asks for titles in the same language and alphabet as the page. When they differ, it often replaces the title in results with text of its own, so the headline searchers see is not the one you chose.',
      fix: 'The writer or editor can rewrite the title in the language of the post, keeping brand and product names as they are; ask your developer if the template sets it.',
    },
    hint: "Write the title in the language and script of the page's main text.",
    explanation:
      "The <title> holds no letter of the script the page's main text is written in — an English title over a Russian article, a transliterated one over a Greek post. Google's title-link guidance asks for a title in the same language and writing system as the page's primary content, and names a mismatch among the reasons it rewrites a title link. A title that mixes the page's script with a Latin brand or product name passes; only a title with no word in the page's own script is reported.",
    sources: [SOURCE.titleLinks],
    skipReason:
      'The page has no title, or too little text to tell which script it is written in.',
  },
  TITLE_YEAR_OUTDATED: {
    // A notice: Ahrefs names freshness in titles; Google draws no line on it (plan D2).
    owner: 'crawl',
    severity: 'notice',
    label: 'Title names a past year',
    plain: {
      what: 'The page title presents a past year as current',
      why: 'A title such as "Best tools for 2025" read in a later year tells searchers the post is out of date before they open it, and fewer of them click. Refreshing the post and its year is one of the cheapest ways to win those clicks back.',
      fix: "The writer or editor can update the post for this year and then the year in its title, in the CMS's title and SEO title fields; changing only the year without the content misleads readers.",
    },
    hint: 'Update the post, then the year in its title; or drop the year if the post is evergreen.',
    explanation:
      'The title ends with a year, or names one after "in", "for" or "в", and that year is earlier than the current year where the client is. Ahrefs recommends a year in titles of topics where freshness matters, and the same year becomes a liability once it passes: searchers read it as a sign of stale advice. Google draws no line on years in titles, and changing a date without changing the content is the very thing DATE_BUMPED_WITHOUT_CHANGES flags, so the fix is to refresh the post, not just the number. A year in the site name after the separator is not read, and neither is one inside the title such as "2024 vs 2025"; a historical title like "SEO in 2008" is reported, and is for the reader to judge.',
    sources: [SOURCE.ahrefsOnPage, SOURCE.titleLinks],
    skipReason: 'No title to read.',
  },
  META_DESCRIPTION_MISSING: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Meta description is missing',
    plain: {
      what: 'This page has no summary for search results',
      why: 'Google then picks a passage from the page to show under the headline, which may be out of context. The summary does not affect rankings, but a well-written one can earn more clicks.',
      fix: 'The writer or editor can add a short, accurate summary of this page in the "meta description" field of your CMS or SEO plugin.',
    },
    hint: 'Without one, search engines pick a snippet from the page themselves.',
    explanation:
      'The meta description is not a ranking factor, but Google may use it as the snippet under the headline in a search result when it describes the page better than any passage of the text. Without one, the snippet is always an excerpt Google picks, which for a long article may be a passage out of context. A short, accurate summary written for this page is what Google recommends.',
    sources: [SOURCE.snippets],
  },
  META_DESCRIPTION_LENGTH: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Meta description length',
    plain: {
      what: 'The summary shown in search results is too long or too short',
      why: 'A long summary gets cut off in results, and a very short one rarely says enough for Google to show it instead of a passage it picks itself. Google sets no fixed limit; the range is a rule of thumb.',
      fix: 'In the meta description field of your CMS, the writer can aim for roughly 70–160 characters that describe this page and give a reason to click.',
    },
    hint: 'Descriptions outside 70–160 characters are cut off or look thin.',
    explanation:
      "Google sets no length limit for meta descriptions; snippets are truncated to the space the result has, which depends on the device. The 70–160 character range is the audit industry's approximation of that space: a longer description is cut, and a much shorter one rarely says enough for Google to prefer it over a passage from the page.",
    sources: [SOURCE.snippets],
    min: 70,
    max: 160,
    skipReason: 'No description to measure.',
  },
  META_DESCRIPTION_REPEATS_TITLE: {
    // A notice: Ahrefs names the rule; Google asks only that a description summarise
    // its page, which a copy of the title rarely does (plan D2).
    owner: 'crawl',
    severity: 'notice',
    label: 'Description repeats the title',
    plain: {
      what: "The page's search description says the same thing as its title",
      why: 'The title and the description sit one above the other in a search result. When they match, the second line tells a searcher nothing new, and Google is more likely to replace it with a passage of its own choosing.',
      fix: 'In the SEO description field of your CMS, the writer or editor can add what the title leaves out: who the post is for, what it answers, what the reader gets.',
    },
    hint: 'Write a description that adds to the title instead of restating it.',
    explanation:
      "The meta description is the same text as the title once case, punctuation and the site's name after the separator are set aside. Google asks for a description that is a short, relevant summary of the specific page; a restated title summarises nothing the result does not already show, so Google tends to build the snippet from the page text instead. Ahrefs' on-page guidance names the rule directly: expand on the title rather than repeat it. A description that adds even one clause passes — how long it is, META_DESCRIPTION_LENGTH judges.",
    sources: [SOURCE.snippets, SOURCE.ahrefsOnPage],
    skipReason: 'No title or no description to compare.',
  },
  H1_MISSING: {
    // A warning, not an error, by the line ranking-signals.md draws: an error is for what
    // keeps a page out of the running, and Google states heading structure does not
    // matter to Search. A page without an h1 is indexed and ranked.
    owner: 'crawl',
    severity: 'warning',
    label: 'H1 is missing',
    plain: {
      what: 'This page has no main heading',
      why: 'Visitors and screen-reader users rely on the main heading to confirm they landed on the right page, and Google reads headings to understand it. The page is still indexed; it just loses a clear signal.',
      fix: 'Ask your developer to make the post title the page\'s main heading (an "H1") in the theme template, or the editor can set the title block to "Heading 1" in the CMS.',
    },
    hint: 'The main heading tells readers and crawlers what the page is about.',
    explanation:
      "The <h1> is the page's main heading: readers and screen readers use it to confirm they are on the page they expected, and Google lists headings among the sources it reads to understand a page and to build its title link. A post whose title is styled as a <div> or an <h2> loses that signal while looking unchanged to a sighted reader.",
    sources: [SOURCE.starterGuide, SOURCE.mdnHeadings],
  },
  H1_MULTIPLE: {
    // A notice: Google has said repeatedly that several h1 elements are no problem for
    // Search, so the cost is to readers and assistive technology alone.
    owner: 'crawl',
    severity: 'notice',
    label: 'More than one H1',
    plain: {
      what: 'This page has more than one main heading',
      why: 'Screen-reader users are told the page is about several things at once. Google says it copes with any heading structure, so this is about clarity for readers, not rankings.',
      fix: 'The editor can keep one top-level heading and turn the others into subheadings in the CMS; if the extra one comes from the theme, ask your developer to change it.',
    },
    hint: 'Several main headings blur what the page is about; keep one.',
    explanation:
      'The HTML standard no longer allows several <h1> elements to describe one document, and MDN advises one per page: a page with several main headings tells screen-reader users that it is about several things. Google says it copes with any heading structure, so the cost is clarity for readers and assistive technology rather than a ranking penalty.',
    sources: [SOURCE.mdnHeadings, SOURCE.starterGuide],
  },

  HEADING_SKIP: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Heading level skipped',
    plain: {
      what: "The subheadings skip a level in the page's outline",
      why: 'People using screen readers move through a page by its headings, and a skipped level makes the outline confusing. Google says heading order does not matter for Search, so this is an accessibility fix, not a ranking one.',
      fix: 'The editor can adjust the heading levels in the CMS so they go in order, for example Heading 2 then Heading 3, never jumping from 2 to 4.',
    },
    hint: 'Going from H2 straight to H4 breaks the outline that headings describe.',
    explanation:
      "Headings form an outline that screen-reader users navigate by, and a jump from <h2> to <h4> tells them a level is missing. MDN asks never to skip heading levels. Google's own guidance is explicit that heading order does not matter to Search, so this is an accessibility and readability finding, not a ranking one.",
    sources: [SOURCE.mdnHeadings, SOURCE.starterGuide],
    skipReason: 'Fewer than two headings — no outline to judge.',
  },
  NO_SUBHEADINGS: {
    // A notice: Google says there is no ideal number of headings. The cost is to readers
    // who scan a long post, and to screen-reader users who move through it by headings.
    owner: 'crawl',
    severity: 'notice',
    label: 'No subheadings',
    plain: {
      what: 'This post is one long block of text with no subheadings',
      why: 'Readers scan a long post by its subheadings to find the part they came for, and without them many leave. Google says there is no ideal number of headings, so this is about readers, not a ranking rule.',
      fix: 'The writer or editor can split the post into sections in the CMS, each under a "Heading 2" that says what the section answers.',
    },
    hint: 'Break a long post into sections under H2 subheadings.',
    explanation: `The main content runs to ${LONG_TEXT_WORDS} words or more with no heading below the title — no <h2> to <h6>. Google's SEO Starter Guide asks for headings that help users navigate a page, while saying there is no magical, ideal number of them; MDN notes that screen-reader users commonly move through a page from heading to heading, and a post without any leaves them nothing to move by. Audit checklists flag a page with no H2 for the same reason. It is not a ranking switch: it is how a long text stays readable.`,
    sources: [
      SOURCE.starterGuide,
      SOURCE.mdnHeadings,
      SOURCE.productiveShopAudit,
    ],
    skipReason: `The text is under ${LONG_TEXT_WORDS} words, short enough to read without sections.`,
  },
  CANONICAL_MISSING: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Canonical URL is missing',
    plain: {
      what: "The page doesn't say which of its web addresses is the main one",
      why: 'The same post is often reachable at several addresses. Without a stated main one, Google chooses for you, and links pointing at the other copies may be credited to an address you did not pick.',
      fix: 'An SEO plugin such as Yoast SEO usually adds this; otherwise ask your developer to add a "canonical" link naming the page\'s preferred address to the page template.',
    },
    hint: 'A canonical link says which URL should rank when copies exist.',
    explanation:
      'The same post is often reachable at several URLs — with and without a trailing slash, with tracking parameters, through a category path. Google groups such copies and picks one to show; a rel="canonical" link in <head> (or a Link HTTP header) is the strongest hint you control about which one. Without it Google picks by itself, and links pointing at the other copies may be credited to a URL you did not choose. Google only accepts the canonical from <head>: one written in <body> is ignored.',
    sources: [SOURCE.canonical, SOURCE.canonicalRfc],
  },
  CANONICAL_MISMATCH: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Canonical points elsewhere',
    plain: {
      what: 'This page tells Google that another address is its main version',
      why: 'Google will usually index that other address and leave this page out of results. That is right for a genuine copy, but on an original post it is usually a template mistake that hides the page.',
      fix: "If this page is the original, check your SEO plugin's settings for it, or ask your developer to make the page name its own address as the main version.",
    },
    hint: 'The page names another URL as canonical, so this one may not be indexed.',
    explanation:
      'This page tells Google that another URL is the preferred version of its content, so Google will usually index that URL and leave this one out of results. That is correct when the page really is a copy; on an original post it is usually a template bug — a canonical built from the wrong variable, or pointing to the www version. The sitemap listing this URL while the page names another one is itself a conflicting signal. A canonical that is this very page over http:// is reported as CANONICAL_TO_HTTP instead.',
    sources: [SOURCE.canonical, SOURCE.sitemaps],
    skipReason:
      'No canonical to disagree with, or it is the page over http:// (CANONICAL_TO_HTTP).',
  },
  CANONICAL_TO_HTTP: {
    // A warning: the page asks Google to prefer the insecure copy of itself, against
    // Google's own default, and the request can win (plan D2).
    owner: 'crawl',
    severity: 'warning',
    label: 'Canonical points to HTTP',
    plain: {
      what: 'This secure page names the insecure http:// address as its main version',
      why: 'Google prefers secure addresses, and this page asks it to prefer the insecure one. That sends mixed signals about which address to show, and can put the http:// version — the one browsers warn about — in search results.',
      fix: 'Ask your developer, or check the site URL setting in your CMS or SEO plugin, so the canonical address starts with https://.',
    },
    hint: 'Make the canonical URL of an HTTPS page an https:// address.',
    explanation:
      'The page is served over HTTPS, but the canonical it declares — in <head>, or in the Link header when the head has none — is the same address over http://. Google prefers HTTPS pages over equivalent HTTP pages as canonical, and a canonical that names the HTTP copy is a signal against that preference: Google may follow it, or weigh it against the redirects and sitemap and pick either. The cause is almost always a site address set to http:// in the CMS or SEO plugin, which every page then repeats. A page served over HTTP is not judged here; NOT_HTTPS reports it. An http:// canonical naming a different page is reported as CANONICAL_MISMATCH instead.',
    sources: [SOURCE.canonical, SOURCE.httpsSignal],
    skipReason:
      'No canonical declared, the page is not served over HTTPS, or the http:// canonical names another page (CANONICAL_MISMATCH).',
  },
  CANONICAL_CONFLICT: {
    // A warning: conflicting canonicals leave the page where CANONICAL_MISSING would — a
    // warning — however confident each tag looks on its own.
    owner: 'crawl',
    severity: 'warning',
    label: 'Conflicting canonical URLs',
    plain: {
      what: 'The page names two different addresses as its main version',
      why: 'A signal that contradicts itself cannot be followed, so Google decides on its own which address to show, and it may not be the one you want.',
      fix: 'Ask your developer to keep a single main-version link. This usually happens when the theme and an SEO plugin each add their own, so one of them can be switched off.',
    },
    hint: 'Declare one canonical URL, in one place; canonicals that disagree are no signal at all.',
    explanation:
      'The page names more than one canonical URL — two <link rel="canonical"> tags, or a tag and a Link header that disagree. Google asks you not to specify different canonical URLs for the same page, and a hint that contradicts itself cannot be followed: Google then chooses the canonical by its own signals. This usually comes from a theme and an SEO plugin each adding their own tag.',
    sources: [SOURCE.canonical],
    skipReason: 'No canonical to disagree with.',
  },
  DEVELOPMENT_HOST_REFERENCES: {
    // A warning: a canonical or hreflang naming a staging host hands the page's signals to
    // a copy nobody should find, and a resource loaded from localhost is missing for
    // every reader.
    owner: 'crawl',
    severity: 'warning',
    label: 'Points at a development or staging host',
    plain: {
      what: 'The page points to a test or staging copy of the site',
      why: "Where the page's main-version or language links point there, Google is asked to credit a copy that should never be found. Links to it send visitors to a server they cannot reach, and they advertise a site meant to stay private.",
      fix: "Ask your developer to replace test and staging addresses with the live site's addresses, and to build links from the site's settings rather than from wherever the site was built or tested.",
    },
    hint: 'Replace development and staging addresses with production URLs; generate them from configuration, not from the host the build ran on.',
    explanation:
      "The page names a development or staging address — localhost, a private IP, a staging., dev. or preview host, or a hosting platform's preview domain such as *.vercel.app — in its canonical, its og:url, its hreflang, a content link or a loaded resource. The usual cause is a URL built from the host the site was built or tested on. A canonical or hreflang pointing there asks Google to consolidate the page into a copy that should not be indexed at all; a link sends readers to a server they cannot reach. Google's advice for keeping such environments out of Search is to password-protect them, which this reference undoes by advertising the address.",
    sources: [SOURCE.canonical, SOURCE.controlSharing],
  },
  CANONICAL_RELATIVE: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Canonical URL is relative',
    plain: {
      what: "The page's main-version link is written without the domain",
      why: 'Google accepts it but asks for full addresses: written this way, a staging copy or an http or www mirror of the page claims to be the main version itself instead of pointing to the real page.',
      fix: 'Ask your developer to write the main-version ("canonical") link as a full address, including https:// and the domain; most SEO plugins already do this.',
    },
    hint: 'Write the canonical as a full URL, with scheme and host.',
    explanation:
      'The canonical is written as a path (href="/post/") rather than a full URL. Google supports relative canonicals, but asks for absolute ones, because a relative path silently follows whatever host serves the page: a staging copy, an http:// mirror or a www variant each declares itself canonical instead of the real page.',
    sources: [SOURCE.canonical],
    skipReason: 'No canonical to judge.',
  },
  NOINDEX: {
    owner: 'crawl',
    severity: 'error',
    label: 'Page is set to noindex',
    plain: {
      what: 'This page is set to stay out of Google',
      why: 'A "noindex" instruction tells Google to drop the page from search results, so it gets no search traffic at all. On a post listed in the sitemap this is almost always a mistake, such as a staging setting left on.',
      fix: 'Check the setting that hides this page (or its category) from search engines in your CMS or SEO plugin; if it comes from the server, ask your developer to remove it.',
    },
    hint: 'A robots meta tag or X-Robots-Tag header — noindex, or an unavailable_after date that has passed — keeps the page out of search results.',
    explanation:
      'A noindex rule — in a <meta name="robots"> or <meta name="googlebot"> tag, or in an X-Robots-Tag HTTP header — tells Google to drop the page from search results, and Google obeys it once it recrawls the page. An unavailable_after date that has passed does the same. On a post listed in the blog sitemap it is almost always unintended: a staging setting left on, or a plugin rule for a category applied too widely. A sitemap entry and a noindex on the same URL are also contradictory signals.',
    sources: [SOURCE.blockIndexing, SOURCE.robotsMeta],
  },
  SNIPPET_RESTRICTED: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Search snippet is restricted',
    plain: {
      what: 'This page stops Google from showing any of its text in results',
      why: 'The result appears with no description, which draws fewer clicks, and Google will not quote the page in AI Overviews either. Sometimes that is intended, but rarely on a blog post that wants readers.',
      fix: 'Unless hiding the text is deliberate, ask your developer, or check your SEO plugin\'s advanced settings, to remove the "nosnippet" or zero-length snippet setting, or the theme\'s no-snippet wrapper around the article.',
    },
    hint: 'Remove nosnippet, max-snippet:0 or a data-nosnippet wrapper around the article unless hiding the text from results is the intent.',
    explanation:
      'A nosnippet or max-snippet:0 rule — in a robots or googlebot meta tag, or an X-Robots-Tag header — tells Google to show no text from the page under its result, and Google applies the same controls to its AI features: the page cannot be quoted in an AI Overview. A data-nosnippet attribute on an element holding most of the article does the same by other means, since Google shows nothing from inside it; one around a passage is an editorial choice and is not reported. Sometimes hiding the text is the point; on a blog post that wants readers it usually is not, and a result with no description draws fewer clicks.',
    sources: [SOURCE.robotsMeta, SOURCE.aiFeatures],
  },
  IMAGE_PREVIEW_NOT_LARGE: {
    // A notice: it decides how large the image beside the page may be, not whether the
    // page ranks.
    owner: 'crawl',
    severity: 'notice',
    label: 'Large image previews not allowed',
    plain: {
      what: "Google is not allowed to show this page's image in large size",
      why: 'Google Discover shows large images only for pages that allow them, and large-image cards draw more clicks than thumbnails. Without the setting the post can appear with a small image, or none, in Discover and in results.',
      fix: "Ask your developer, or check your SEO plugin's settings, to add max-image-preview:large to the page's robots meta tag; WordPress adds it by default unless something removes it.",
    },
    hint: 'Add max-image-preview:large to the robots meta tag.',
    explanation:
      "No robots meta tag or X-Robots-Tag allows Google a large image preview: max-image-preview is absent, set to standard, or set to none. Google's Discover guidance names max-image-preview:large (or AMP) as the setting that enables large images there, and without the rule Google may show only a default-size preview. Where declarations disagree, the more restrictive one applies, so one tag saying none or standard overrides another saying large. It is not a ranking signal: it decides how large the image beside the page may be.",
    sources: [SOURCE.discover, SOURCE.robotsMeta],
  },
  ROBOTS_BLOCKS_GOOGLEBOT: {
    // An error by the line ranking-signals.md draws: a page Googlebot may not fetch is out
    // of the running, exactly like a noindexed one.
    owner: 'crawl',
    severity: 'error',
    label: 'robots.txt blocks Googlebot',
    plain: {
      what: "The site's robots.txt stops Google from reading this page",
      why: 'Google cannot read the content, so it cannot rank the page for it. The address may still appear in results, but with no description, known only from what other pages say about it.',
      fix: 'Ask your developer or web team to remove or narrow the robots.txt rule that blocks Google from this address; some SEO plugins let you edit robots.txt directly.',
    },
    hint: 'Remove or narrow the Disallow rule that matches this URL for Googlebot.',
    explanation:
      "The site's robots.txt forbids Googlebot from fetching this URL, so Google cannot read the page's content and cannot rank it on that content. The URL can still appear in results — robots.txt blocks crawling, not indexing — but without a description, known only from what other pages say about it. This tracker obeys robots.txt under its own name, which is why it could read the page; Googlebot obeys the group addressed to it, and that group says no.",
    sources: [SOURCE.robotsIntro, SOURCE.robotsSpec, SOURCE.robotsRfc],
    skipReason: "The site's robots.txt does not govern this page's host.",
  },
  ROBOTS_BLOCKS_RESOURCES: {
    owner: 'crawl',
    severity: 'warning',
    label: 'robots.txt blocks scripts or styles',
    plain: {
      what: 'Google is blocked from the files that make this page look and work right',
      why: 'Google views a page as a browser would before indexing it. With styling or scripts blocked, the page can look broken or unfit for phones to Google, and content added by scripts may be missed.',
      fix: "Ask your developer to change the site's robots.txt so Google may fetch the style and script files this page needs.",
    },
    hint: 'Allow Googlebot to fetch the CSS and JavaScript the page needs to render.',
    explanation:
      "Google renders a page in a headless Chrome before indexing it, fetching every script and stylesheet as Googlebot and obeying robots.txt — and it states that it will not render JavaScript from blocked files. A blocked stylesheet can make the page look broken or unfit for mobile to Google; a blocked script can leave out whatever that script puts on the page. Only resources on the site's own host are judged, because only its robots.txt was read.",
    sources: [SOURCE.javascriptSeo, SOURCE.robotsIntro],
    skipReason:
      "The page loads no scripts or stylesheets from a host the site's robots.txt governs.",
  },
  ROBOTS_BLOCKS_AI_SEARCH: {
    owner: 'crawl',
    severity: 'notice',
    label: 'robots.txt blocks AI search crawlers',
    plain: {
      what: 'AI search tools such as ChatGPT search are blocked from this page',
      why: 'ChatGPT search, Perplexity, Claude and Copilot (through Bing) cannot show or cite the page in their answers. It does not affect Google Search, and blocking AI training bots is a separate, legitimate choice not judged here.',
      fix: 'If you want to be cited by these assistants, ask your developer to allow their search crawlers in robots.txt; their training crawlers can stay blocked.',
    },
    hint: 'Allow the search crawlers of the assistants you want to be cited by; their training crawlers are a separate choice.',
    explanation:
      "robots.txt keeps one or more search crawlers of AI assistants from this page — OAI-SearchBot (ChatGPT search), PerplexityBot, Claude-SearchBot, or Bingbot, whose index Copilot answers from. OpenAI documents that a site opted out of OAI-SearchBot is not shown in ChatGPT search answers, Perplexity asks sites to allow PerplexityBot to appear in its results, and Anthropic says blocking Claude-SearchBot may reduce a site's visibility in Claude's search results. This is not about training: GPTBot, ClaudeBot and Google-Extended govern training and are not judged here, because closing them is a legitimate choice that costs no visibility. It does not affect Google Search.",
    sources: [
      SOURCE.openAiBots,
      SOURCE.perplexityBots,
      SOURCE.claudeBots,
      SOURCE.bingCrawlers,
    ],
    skipReason: "The site's robots.txt does not govern this page's host.",
  },
  IMAGES_MISSING_ALT: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Images without alt text',
    plain: {
      what: 'Some images on this page have no text description',
      why: 'Screen readers have nothing to announce for them, and Google relies on this text to understand images for image search. Purely decorative images should be marked as decorative instead.',
      fix: 'The writer or editor can fill in the "alt text" field for each image in the CMS, describing in a few words what the image shows.',
    },
    hint: 'Alt text describes an image to screen readers and image search.',
    explanation:
      'Alt text is what a screen reader announces in place of an image and what a browser shows when the image fails to load. Google calls it the most important attribute for providing metadata about an image, and uses it together with the surrounding text for image search. An image that carries no information should have an empty alt="" so assistive technology skips it; an image without the attribute at all leaves the reader to guess.',
    sources: [SOURCE.images, SOURCE.waiImages],
    skipReason: 'The page has no images.',
  },
  NO_IMAGES: {
    // A notice: no search engine asks for a number of images. Google's starter guide asks
    // for images near relevant text; the AI-search figure is industry data.
    owner: 'crawl',
    severity: 'notice',
    label: 'No images in the content',
    plain: {
      what: 'This post has no images',
      why: 'Many people search visually, and an image is often how a post is first found in Google Images or shown beside a result. A long post with no chart, screenshot or photo is also harder to read.',
      fix: 'The writer or editor can add at least one relevant image in the CMS — a chart, screenshot or diagram — near the text it illustrates, with alt text.',
    },
    hint: 'Add at least one relevant image near the text it illustrates.',
    explanation: `The main content runs to ${LONG_TEXT_WORDS} words or more, holds no <img>, frame or video, and the page shows no featured image either. Google's SEO Starter Guide asks sites to add high-quality images near relevant text, because many people search visually and an image can be how a page is found for the first time. Productive Shop's study of pages appearing in AI Overviews reports that they tend to carry more images — about five on an average blog post — which is a correlation in industry data, not a rule any search engine states. An embedded demo or video player counts as the post's visuals; images drawn by CSS or inline SVG are not seen by this check.`,
    sources: [
      SOURCE.starterGuide,
      SOURCE.images,
      SOURCE.productiveShopAiSearch,
    ],
    skipReason: `The text is under ${LONG_TEXT_WORDS} words, short enough to stand without an image.`,
  },
  IMAGES_NOT_INDEXABLE: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Images without a src fallback',
    plain: {
      what: 'Some images give only a set of sizes, with no plain image address',
      why: "Google finds images through an image element's plain address. One given only as a set of sizes has no fallback, so Google Images and browsers that do not read that set may never show it.",
      fix: 'Ask your developer to give every image a plain src beside its srcset; a theme or image plugin usually writes both, and the template that drops src is the one to fix.',
    },
    hint: 'Give each <img> with a srcset a src as well.',
    explanation:
      "An <img> carries a srcset and no src. Google finds images in the src attribute of <img> elements, and asks every responsive image to keep an <img> with src as the fallback for crawlers and browsers that do not read srcset or <picture>. Each image reported is quoted. The file's format is not judged from its extension: image CDNs convert on the way out — shopify.com answers its .heic uploads as JPEG — so an extension says nothing certain about what Google receives. An image a lazy-loading script sets from data-src is not reported: Google renders the page and sees what the script sets.",
    sources: [SOURCE.images],
    skipReason: 'The page has no images.',
  },
  IMAGE_FILENAMES_GENERIC: {
    // A notice: a file name is a light hint, and Google says so.
    owner: 'crawl',
    severity: 'notice',
    label: 'Images with camera or placeholder file names',
    plain: {
      what: 'Some images keep file names like IMG_1234.jpg that say nothing',
      why: "Google uses an image's file name as a small hint about what it shows. A camera default such as IMG_1234 or a placeholder like image1 gives image search nothing, while a few descriptive words help it understand the picture.",
      fix: 'The writer or editor can rename images before uploading them, in a few words saying what each shows; an image plugin in the CMS can rename new uploads automatically.',
    },
    hint: 'Rename images in a few descriptive words: black-kitten.jpg, not IMG00023.JPG.',
    explanation:
      "Google's image guidance asks for short, descriptive file names, because the name is a light clue to the image's subject — my-new-black-kitten.jpg rather than IMG00023.JPG — and names generic ones such as image1.jpg and 1.jpg as the thing to avoid. Only names a camera, phone or tool gives by default (IMG_1234, DSC01234, PXL_20260101…, Screenshot 2026-…) and placeholders (image1, untitled, 1.jpg) are reported. Hashed names a CDN or platform generates are not: the author never chose them and cannot change them. A WordPress size suffix (-1024x768) is ignored.",
    sources: [SOURCE.images],
    skipReason: 'The page has no images with a file name.',
  },
  VIDEO_WITHOUT_METADATA: {
    // A notice: eligibility for video features, never a defect of the page.
    owner: 'crawl',
    severity: 'notice',
    label: 'Video without video metadata',
    plain: {
      what: 'The page shows a video but tells Google nothing about it',
      why: "Without video details Google has to guess the video's title, thumbnail and date, and the page is less likely to appear in video results or with a video preview. It does not affect the page's ordinary ranking.",
      fix: 'An SEO or video plugin can add the video details to the page; otherwise ask your developer to add VideoObject markup with a name, a thumbnail and an upload date.',
    },
    hint: 'Add VideoObject structured data (name, thumbnailUrl, uploadDate) or og:video for each video.',
    explanation:
      'The page embeds a video — a <video> a reader can play, or a YouTube, Vimeo, Wistia or similar player — and declares neither VideoObject structured data nor an og:video tag. Google recommends providing video metadata through structured data, a video sitemap or Open Graph, so that it can find the video, show its thumbnail and consider it for video features such as key moments. A video sitemap is not visible from the page, so a site that lists its videos in one may see this reported and can set it aside. A muted video without controls is a moving background, not a video, and is not counted.',
    sources: [SOURCE.video, SOURCE.structuredDataIntro],
    skipReason: 'The page embeds no video.',
  },
  THIN_CONTENT: {
    // A notice: Google says it has no preferred word count, so a short page is a prompt
    // to reread it, not a defect on the page.
    owner: 'crawl',
    severity: 'notice',
    label: 'Thin content',
    plain: {
      what: 'This page has very little text',
      why: 'Under 300 words a post is often a stub or teaser that does not fully answer a search, which makes it harder to rank. Google has no minimum word count, so a short page that answers the question fully is fine.',
      fix: 'The writer can reread the page and add what a searcher still needs, or the editor can merge it into a fuller related post.',
    },
    hint: 'Posts under 300 words rarely answer a query well enough to rank.',
    explanation:
      "Google says plainly that it has no preferred word count, and a short page that fully answers its question is fine. The 300-word line is an audit heuristic, not a Google rule: below it a blog post is more often a stub, a teaser for another page or a placeholder than a complete answer, and Google's guidance asks whether a page provides substantial, complete value compared with others on the topic. Read the page and decide whether it says everything a searcher needs.",
    sources: [SOURCE.helpfulContent],
    min: LONG_TEXT_WORDS,
  },
  AUTHOR_MISSING: {
    owner: 'crawl',
    severity: 'notice',
    label: 'No author named',
    plain: {
      what: "The page doesn't say who wrote it",
      why: "Google's guidance suggests a byline so readers can judge the expertise behind a post. It is not a ranking switch, but an anonymous post gives readers one less reason to trust it.",
      fix: "The editor can show an author byline linked to an author bio in the CMS; ask your developer to include the author in the page's article details for Google too.",
    },
    hint: 'Name the author on the page and in the article markup, linked to a page about them.',
    explanation:
      'Nothing on the page says who wrote it: no author in the article markup, no <meta name="author">, no rel="author" link and no byline the markup identifies. Google\'s guidance on helpful content asks "who created the content" first and suggests a byline linking to more about the author — it helps readers judge the expertise behind a post. It is not a ranking switch: adding a name does not add expertise, but hiding who wrote a post takes away a reason to trust it.',
    sources: [SOURCE.helpfulContent, SOURCE.articleMarkup],
  },
  DATE_BUMPED_WITHOUT_CHANGES: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Date changed, content did not',
    plain: {
      what: "The page's updated date changed but its content didn't",
      why: 'Google names refreshing dates without real changes as a sign of content made for search engines rather than people. Often it is just a CMS that updates the date on every save, but it can look like faked freshness.',
      fix: 'Editors should change the updated date only after a real revision. If the CMS or a plugin changes it on every save or deploy, ask your developer to stop that.',
    },
    hint: 'Change the modified date only when the content substantially changes.',
    explanation:
      'Since the previous crawl the page\'s declared modification date moved, while its main content stayed word-for-word the same. Google\'s guidance on helpful content names "changing the date of pages to make them seem fresh when the content has not substantially changed" as a mark of content written for search engines rather than people. Often it is not deliberate: a CMS that rewrites dateModified on every save or deploy does the same.',
    sources: [SOURCE.helpfulContent, SOURCE.bylineDates],
    skipReason:
      'No earlier crawl of this page to compare with, or the page declares no modification date.',
  },
  NO_INTERNAL_LINKS: {
    // The content's own links, not the template's: the extractor has already removed the
    // nav, the related-posts rail and the share bar, so what is left is what the author
    // wrote. A page the theme links from every sidebar still fails this, correctly.
    owner: 'crawl',
    severity: 'notice',
    label: 'Content links nowhere on the site',
    plain: {
      what: "The text of this page doesn't link to any other page on the site",
      why: "Links in the text help Google find your other pages and understand what they are about, and carry readers deeper into the site. Menus, sidebars and footers don't count here, only links the author wrote.",
      fix: 'The writer can add a few links in the body text to related posts or service pages, using words that describe the page being linked to.',
    },
    hint: 'Links written into the text carry readers and crawlers on to the pages they name.',
    explanation:
      "Google finds pages and learns how they relate mainly by following links, and reads a link's anchor text as a description of the page it points to. A post whose text never links to another page on the same site passes none of that on. Links to a heading of this same page (a table of contents) do not count, since they lead nowhere new; nor do the navigation, related-posts rail and footer, which are not what the author wrote.",
    sources: [SOURCE.crawlableLinks, SOURCE.starterGuide],
  },
  NO_EXTERNAL_SOURCES: {
    // A notice: Google asks for clear sourcing as a mark of trust, but a post built on the
    // company's own data or the author's own experience may rightly cite nothing.
    owner: 'crawl',
    severity: 'notice',
    label: 'Cites no outside sources',
    plain: {
      what: "The text of this post doesn't link to any other website",
      why: 'Google lists clear sourcing among the signs that content can be trusted. A post that states facts or figures without saying where they come from asks readers, and the AI assistants that quote pages, to take them on trust.',
      fix: 'The writer can link the statistics, studies and quotes in the post to their original sources; if the post rests only on your own data or experience, this can be set aside.',
    },
    hint: 'Link claims, statistics and quotes to the sources they come from.',
    explanation: `The main content runs to ${LONG_TEXT_WORDS} words or more and none of its links leads to another site. Google's guidance on helpful content names clear sourcing among the things that make content trustworthy, and its SEO Starter Guide recommends linking to resources that corroborate what you write; Productive Shop's guidance on being cited by AI assistants asks for the same. Not every post needs a source: one resting on the company's own data or the author's own experience may rightly link nowhere. The site's own subdomains count as the site, not as sources, and the navigation, sidebar and share buttons are not read.`,
    sources: [
      SOURCE.helpfulContent,
      SOURCE.starterGuide,
      SOURCE.productiveShopGeo,
    ],
    skipReason: `The text is under ${LONG_TEXT_WORDS} words, short enough to need no sources.`,
  },
  INTERNAL_LINKS_NOFOLLOW: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Internal links marked nofollow',
    plain: {
      what: 'Links to the site\'s own pages are marked "nofollow"',
      why: 'That mark is meant for links you do not vouch for. On links to your own posts it only withholds what those links would tell Google about them. A small effect, usually caused by a plugin or template.',
      fix: 'Ask your developer to remove the "nofollow" mark from links to your own pages, or find which plugin or theme setting adds it to every link.',
    },
    hint: 'Drop rel="nofollow" from links to your own pages; use robots.txt to keep a page from being crawled.',
    explanation:
      'rel="nofollow" asks Google not to associate your site with the linked page and not to crawl it from yours. Google reserves it for links you do not vouch for, and for links within your own site points to robots.txt instead. On a link to your own post it only withholds what the link would have told Google about that page — usually a template or a plugin adding the attribute to every link indiscriminately.',
    sources: [SOURCE.qualifyLinks],
    skipReason: 'The content links nowhere on the site.',
  },
  INTERNAL_LINK_VARIANTS: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Internal links to non-canonical URLs',
    plain: {
      what: "Links to the site's own pages use outdated or tracking-tagged addresses",
      why: 'Each such link costs an extra redirect or creates a duplicate address that Google has to crawl and match back to the real page. Google asks sites to link to their preferred addresses.',
      fix: 'The editor can update these links in the CMS to the exact live address (https, the right www form, no tracking tags); ask your developer if the template adds them.',
    },
    hint: 'Link to the URL the site actually serves: same scheme, same host, no tracking parameters.',
    explanation:
      'The content links to pages of this site through a different URL than the one this page is served at — plain HTTP from an HTTPS page, the www host from a site served without it (or the other way round), or a URL carrying tracking or session parameters. Each such link costs a redirect or creates a duplicate URL for Google to crawl and fold back into the canonical one. Google asks sites to link internally to the canonical URL rather than a duplicate, and to avoid session IDs in URLs.',
    sources: [SOURCE.canonical, SOURCE.urlStructure],
    skipReason: 'The content links nowhere on the site.',
  },
  LINKS_WITHOUT_TEXT: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Links with no text',
    plain: {
      what: 'Some links on this page have no words to describe them',
      why: 'Google reads link text to learn what the linked page is about, so these links tell it nothing. Screen readers announce them as just "link", which fails accessibility guidelines.',
      fix: 'The editor can add descriptive text, or alt text on a linked image, in the CMS; for icon links in the template, ask your developer to add a hidden label.',
    },
    hint: 'Give every link words: text, alt on a linked image, or an aria-label.',
    explanation:
      'Some links in the content have no text at all — an icon or an image without alt inside an <a>. Google reads a link\'s text as a description of the page it points to, falls back to the title attribute and, for a linked image, to its alt text; a link with none of these tells it nothing. A screen reader announces such a link by its URL, or as just "link", which WCAG 2.2 counts as a failure of link purpose. Text hidden visually for screen readers counts and passes.',
    sources: [SOURCE.crawlableLinks, SOURCE.wcagLinkPurpose],
  },
  UNCRAWLABLE_LINKS: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Links Google cannot follow',
    plain: {
      what: 'Some links on this page are dead ends for Google',
      why: 'They work for a visitor clicking with a mouse, but Google cannot follow them, so the pages they lead to are not discovered through them and get no credit from the link.',
      fix: 'Ask your developer to turn these into real links with a proper web address, keeping any script behaviour on top of them.',
    },
    hint: 'Give every link a real URL in href; keep JavaScript for behaviour on top of it.',
    explanation:
      'Google states that it can generally only crawl a link if it is an <a> element with an href attribute that resolves to a real web address. An <a> that navigates through onclick with no href, or whose href is a javascript: call, works for a reader with a mouse and is a dead end for a crawler: the page it leads to is not discovered through it and receives none of its anchor text. A control that leads nowhere — javascript:void(0), a toggle whose script names no address — is not reported: there is no page behind it to miss. A client-side route in the fragment (href="#/pricing", "#!pricing") is the same dead end: Google drops everything after #, so the link leads to the page it sits on, and Google asks single-page apps to route with the History API instead.',
    sources: [SOURCE.crawlableLinks, SOURCE.javascriptSeo],
  },
  LANG_MISSING: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Language is not declared',
    plain: {
      what: "The page doesn't declare what language it's written in",
      why: 'This does not affect Google rankings: Google detects the language from the text. It matters to visitors, as screen readers use it for pronunciation and browsers for translation, and accessibility standards require it.',
      fix: "Ask your developer to declare the page's language in the theme template so every page carries it.",
    },
    hint: 'Add lang to <html> so browsers, screen readers and translation tools read the page right.',
    explanation:
      "Google determines a page's language from its visible text and states that it does not use the lang attribute, so this does not affect Google rankings. It still matters to readers: screen readers choose pronunciation by it, browsers offer translation and hyphenate by it, and WCAG 2.2 requires the page's language to be declared (success criterion 3.1.1).",
    sources: [SOURCE.wcagLanguage, SOURCE.multiRegional],
  },
  HREFLANG_INVALID: {
    // Also fails a page that declares hreflang while its canonical names another URL: the
    // page then calls itself a duplicate and drops out of its own set.
    // Reciprocity — does the page named back link here — is the other half of Google's
    // requirement and is deliberately not checked: it needs the other document, which
    // is usually on another site and never in this crawl. What is checked is what one
    // page can answer about itself.
    owner: 'crawl',
    severity: 'notice',
    label: 'Hreflang is malformed',
    plain: {
      what: "The page's links to its other language versions contain errors",
      why: 'These links tell Google which version to show readers of each language or country. With a wrong code, Google may ignore them and show visitors the wrong language version.',
      fix: 'Ask your developer, or check your multilingual plugin, to use valid codes (for example "uk" for Ukrainian and "en-GB" for the UK).',
    },
    hint: 'A hreflang with an invalid language code is ignored.',
    explanation:
      'hreflang links tell Google which URL to show readers of each language or region. Google requires each value to be a valid ISO 639-1 language code, optionally followed by an ISO 3166-1 region; annotations that break this rule may be ignored, and readers shown the wrong language version. The usual slips are country codes written for languages — ua for Ukrainian (uk), kz for Kazakh (kk), jp for Japanese (ja) — and UK for the United Kingdom (GB). A page whose canonical names another URL declares itself a duplicate, which takes it out of its own hreflang set. A set that leaves out this page is reported as its own finding.',
    sources: [SOURCE.hreflang],
    skipReason: 'The page declares no hreflang.',
  },
  HREFLANG_NO_SELF_REFERENCE: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Hreflang omits this page',
    plain: {
      what: "The page's list of language versions leaves out the page itself",
      why: 'Google asks every language version to list itself as well as the others. When the page is missing from its own list, Google may ignore the whole list and show readers the wrong language version.',
      fix: 'Ask your developer, or check your multilingual plugin, so the list of language versions on every page includes that page itself.',
    },
    hint: 'List the page itself among its hreflang alternates.',
    explanation:
      "The page declares hreflang alternates, and none of them is the page itself; a trailing slash is not counted as a difference. Google's documentation on localized versions requires each language version to list itself as well as all the others, and annotations that break the rule may be ignored. The usual cause is a template or plugin that writes the other languages and skips the current one. A page with no hreflang at all is not judged.",
    sources: [SOURCE.hreflang],
    skipReason: 'The page declares no hreflang.',
  },
  VIEWPORT_MISSING: {
    // A warning and not an error, by the line ranking-signals.md draws: an error is for
    // what keeps a page out of the running — unreachable, noindexed, canonicalised away.
    // A page without a viewport is indexed; it is just indexed as rendered on a phone.
    owner: 'crawl',
    severity: 'warning',
    label: 'No mobile viewport',
    plain: {
      what: "The page isn't set up to display properly on phones",
      why: 'Google ranks the version of a page it sees on a phone. Without this setting, phones show the desktop layout shrunk down, so text is tiny and visitors have to zoom in, a poor first impression on mobile.',
      fix: 'Ask your developer to add the standard mobile "viewport" setting to the theme template, or move to a mobile-friendly theme.',
    },
    hint: 'Google indexes the mobile version; without a viewport the page renders at desktop width on a phone.',
    explanation:
      'Google indexes and ranks the version of a page its smartphone crawler sees. Without <meta name="viewport" content="width=device-width, initial-scale=1">, mobile browsers lay the page out at a desktop width (typically 980 px) and shrink it to fit, so text is tiny and readers have to zoom.',
    sources: [SOURCE.mobileFirst, SOURCE.mdnViewport],
  },
  OG_TAGS_MISSING: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Open Graph tags missing',
    plain: {
      what: "Links to this page won't look good when shared on social media",
      why: 'Without sharing details, social networks and messaging apps guess the title, text and image, often showing the logo or no image at all. This does not affect Google rankings, but can cost clicks from shares.',
      fix: 'Most SEO plugins, such as Yoast SEO, can fill in the sharing details; the editor can set a sharing title, description and image for the page in the CMS.',
    },
    hint: 'og:title, og:description and og:image control how shared links look.',
    explanation:
      'Open Graph tags decide the title, description and image shown when the post is shared on social networks and in messengers. They do not affect Google rankings. Without them each platform guesses, and a shared link often shows the site logo or no image at all.',
    sources: [SOURCE.openGraph],
  },
  OG_URL_MISMATCH: {
    owner: 'crawl',
    severity: 'notice',
    label: 'og:url differs from the canonical',
    plain: {
      what: "The page's sharing address differs from its main address",
      why: 'Social networks count likes and shares under the sharing address, and Google ranks the main one. When they differ, one post has two identities: shares can be counted for the wrong page, and a shared link can open a different address than search shows.',
      fix: 'Most SEO plugins set the sharing address from the canonical automatically; ask your developer to make the theme do the same if it writes og:url itself.',
    },
    hint: 'Set og:url to the canonical URL of the page.',
    explanation:
      "The page's og:url names a different document from its canonical URL — or, when it declares no canonical, from the address it was served at; a trailing slash is not counted as a difference. The Open Graph protocol defines og:url as the canonical URL of the object, the permanent ID social platforms use to collect its likes and shares. When it disagrees with the canonical, shares and search results describe two addresses for one post. It does not affect Google rankings. The usual cause is a theme that writes og:url from the request address, with tracking parameters or a different host. An og:url on a staging or preview host is reported as DEVELOPMENT_HOST_REFERENCES instead.",
    sources: [SOURCE.openGraph, SOURCE.canonical],
    skipReason:
      'The page declares no og:url, or it names a development host (DEVELOPMENT_HOST_REFERENCES).',
  },
  PREVIEW_IMAGE_TOO_SMALL: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Preview image is narrower than 1200 px',
    plain: {
      what: 'The image chosen to represent this page is too small for Discover',
      why: 'Google Discover asks for images at least 1,200 pixels wide. A smaller one can only appear as a thumbnail, and large-image cards draw more clicks.',
      fix: 'The editor can set a featured image at least 1,200 pixels wide in the CMS; ask your developer if the SEO plugin or theme points to a resized copy instead of the original.',
    },
    hint: 'Use a representative image at least 1,200 px wide for og:image and the article markup.',
    explanation:
      "The image the page names for itself — og:image, or else the first image of its article markup — is under 1,200 pixels wide. Google's Discover guidance asks for images at least 1,200 px wide, specified through og:image or schema.org markup, and its Article guidance asks for high-resolution images. The width is read from the file itself, which the crawl fetches the start of: the sizes a page declares are often not the image's (a theme names a resized copy, or declares the wrong width). A site logo used as the image is reported by PREVIEW_IMAGE_IS_LOGO instead, not twice.",
    sources: [SOURCE.discover, SOURCE.articleMarkup],
    min: 1_200,
    skipReason:
      'The page names no image of its own, its file could not be read, or it is the site logo.',
  },
  PREVIEW_IMAGE_IS_LOGO: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Preview image is the site logo',
    plain: {
      what: "The image chosen to represent this page is the site's logo",
      why: 'Google advises against using a logo as the page image: it says nothing about the post, so in Discover and image results the page looks like every other page of the site and draws fewer clicks.',
      fix: 'The editor can set a featured image showing what the post is about; ask your developer if the theme or SEO plugin falls back to the logo when none is set.',
    },
    hint: "Set og:image and the article image to a picture of the post's subject, not the logo.",
    explanation:
      "The image the page names for itself — og:image, or the image in its article markup — is the site's logo: the same URL as a logo its structured data declares, or a file named logo. Google's Discover guidance asks not to use generic images such as the site logo in og:image or schema.org markup, and its image guidance asks for a relevant, representative image. A theme usually does this when a post has no featured image and it falls back to the logo.",
    sources: [SOURCE.discover, SOURCE.images],
    skipReason: 'The page names no image for itself.',
  },
  CHARSET_MISSING_OR_LATE: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Character encoding declared late or not at all',
    plain: {
      what: 'Accented letters and symbols on this page may show up garbled',
      why: 'The page does not tell browsers early enough how its text is encoded, so a browser may guess wrong and display accented letters, non-Latin scripts and curly quotes as gibberish.',
      fix: 'Ask your developer or hosting provider to send the UTF-8 encoding with the page, or to move the encoding declaration to the very top of the page template.',
    },
    hint: 'Send charset=utf-8 in the Content-Type header, or put <meta charset="utf-8"> first in <head>.',
    explanation:
      'Neither the Content-Type header nor the first 1024 bytes of the HTML say how the text is encoded. The HTML standard requires a <meta charset> to sit entirely within those first 1024 bytes; a browser that has to guess may decode the page in a legacy encoding and show every non-ASCII character as garbage — accented letters, Cyrillic, curly quotes. A late declaration usually follows a large inline script or style placed before it.',
    sources: [SOURCE.htmlCharset, SOURCE.mdnMeta],
  },
  NOT_HTTPS: {
    owner: 'crawl',
    severity: 'error',
    label: 'Not served over HTTPS',
    plain: {
      what: 'This page is not served over a secure connection',
      why: 'Browsers label it "Not secure", which undermines visitors\' trust, and data sent to it can be read or altered on the way. Google counts security as a ranking signal, but only a very light one.',
      fix: 'Your hosting provider or developer can install a security certificate and permanently redirect every http address to https.',
    },
    hint: 'Browsers mark plain HTTP pages as not secure, and search engines prefer HTTPS.',
    explanation:
      'The page was served over plain HTTP. Browsers label such pages "Not secure" and traffic to them can be read and altered on the way — the reason this is an error is the reader\'s trust, not rankings: Google has counted HTTPS since 2014, but announced it as a very lightweight signal. Serve every page over HTTPS and redirect HTTP to it permanently.',
    sources: [SOURCE.httpsSignal, SOURCE.enableHttps],
  },
  MIXED_CONTENT: {
    // Skipped rather than passed on an http page: there is no mixing, and passing would
    // reward the page for the very thing NOT_HTTPS is failing it for.
    owner: 'crawl',
    severity: 'warning',
    label: 'Insecure resources on a secure page',
    plain: {
      what: 'This secure page loads some files over an insecure connection',
      why: 'Browsers block or flag those files, so images, scripts or styling may be missing for visitors and for Google, and the padlock in the address bar disappears.',
      fix: 'Ask your developer to switch those files to https addresses; the editor can update old image links inside posts in the CMS.',
    },
    hint: 'Browsers block images and scripts fetched over plain HTTP on an HTTPS page; serve them over HTTPS.',
    explanation:
      "The page is served over HTTPS but loads some resources over plain HTTP. Browsers block insecure scripts, stylesheets and frames on a secure page outright and upgrade or flag insecure images, so parts of the page may be missing for readers — and for Google's renderer, which is a Chrome browser. The padlock is lost as well.",
    sources: [SOURCE.mixedContent, SOURCE.mdnMixedContent],
    skipReason: 'The page is not served over HTTPS, so nothing is mixed.',
  },
  REDIRECTED: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Sitemap URL redirects',
    plain: {
      what: 'The sitemap lists this page at an address that redirects',
      why: 'The sitemap should list the addresses you want in results. A redirecting entry wastes a request on every crawl, and with a temporary redirect Google keeps showing the old address.',
      fix: "Ask your developer, or check your sitemap plugin, so the sitemap lists this page's final address instead of the one that redirects.",
    },
    hint: 'The sitemap lists a URL that redirects; list the final URL instead.',
    explanation:
      'A sitemap should list the canonical URLs you want shown in results. This entry redirects, so every crawl of it costs an extra request and the sitemap names a URL that is not the one you want indexed. The status matters too: Google shows the target of a permanent redirect (301, 308) in results, but keeps showing the source of a temporary one (302, 307).',
    sources: [SOURCE.sitemaps, SOURCE.redirects],
  },
  META_REFRESH: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Redirects with a meta refresh',
    plain: {
      what: 'This page sends visitors elsewhere with a slow, in-page redirect',
      why: 'Google understands it but reads it less reliably than a proper server redirect; visitors see the old page flash first, and some other search engines may not follow it at all.',
      fix: 'Ask your developer or hosting provider to replace it with a permanent server-side (301) redirect; a redirect plugin in your CMS may also do it.',
    },
    hint: 'Google asks for a server-side 301; a meta refresh is slower and states the move less clearly.',
    explanation:
      'The page moves readers on with <meta http-equiv="refresh">. Google understands it — an instant refresh as a permanent redirect, a delayed one as a temporary one — but ranks it below server-side redirects for how reliably the move is interpreted, and suggests it only where a server-side redirect is not possible. Readers see the old page flash first, and other crawlers may not follow it at all.',
    sources: [SOURCE.redirects],
  },
  LARGE_PAGE: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Large HTML',
    plain: {
      what: "This page's code is unusually large to download",
      why: 'Google reads only the first 2 MB of a page and never indexes the rest; this page is past 1 MB, so there is still room to act. The same weight slows the page for visitors on mobile connections.',
      fix: "Ask your developer to move large embedded data, images or graphics out of the page's code, so the text comes first and the page downloads faster.",
    },
    hint: 'HTML over 1 MB is slow to download and parse; Googlebot reads only the first 2 MB.',
    explanation:
      'When crawling for Google Search, Googlebot reads only the first 2 MB of an HTML file; anything past that is never indexed. This check fires at half that, while there is still room to act. Most pages this large carry a big inline data blob — framework hydration state, embedded SVGs, base64 images — ahead of the text, and the same weight slows every reader on a mobile connection.',
    sources: [SOURCE.googlebot],
    max: 1_048_576,
  },
  LCP_IMAGE_LAZY_LOADED: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Featured image is lazy-loaded',
    plain: {
      what: 'The featured image is likely set to load late, slowing the top of the page',
      why: "Something in the page's code tells browsers to wait before fetching the main image, which usually makes the page appear later. This is a risk read from the code, not a speed measurement. Speed is a small ranking signal; the bigger cost is visitors.",
      fix: 'Ask your developer to load the featured image straight away instead of lazily. WordPress itself stopped lazy-loading the first featured image, so an outdated theme or plugin may be the cause.',
    },
    hint: 'Load the featured image eagerly — drop loading="lazy" and add fetchpriority="high".',
    explanation:
      'The image the page names as its featured image (og:image) sits at the top of the post, under the headline, and is marked loading="lazy". A featured image there is usually the page\'s Largest Contentful Paint, and a lazy image is only requested once layout has shown it to be on screen — hundreds of milliseconds after the browser could have started. web.dev measured that lazy-loading above-the-fold images makes LCP worse, which is why WordPress stopped lazy-loading the first featured image. Core Web Vitals are a page-experience signal Google\'s ranking systems reward, but a small one; the bigger cost is to readers. This is read from the HTML, not measured in a browser: only field data (Chrome UX Report) says what LCP readers actually get.',
    sources: [SOURCE.lcpLazyLoading, SOURCE.optimizeLcp, SOURCE.coreWebVitals],
    skipReason:
      'The page shows no featured image at the top of the post to judge.',
  },
  RENDER_BLOCKING_SCRIPTS: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Scripts in <head> block rendering',
    plain: {
      what: "Scripts at the top of the page's code likely delay it from appearing",
      why: "Something in the page's code makes browsers download and run these scripts before showing anything. This is a risk read from the code, not a measurement: how long the delay is depends on the scripts and the visitor's connection.",
      fix: 'Ask your developer to load these scripts in a deferred way, so they no longer hold up the first view of the page.',
    },
    hint: 'Add defer (or async, for scripts nothing depends on) to external scripts in <head>.',
    explanation:
      "External scripts in <head> without async or defer stop the HTML parser: nothing below them is parsed, and nothing is painted, until each is downloaded and run. Every one of them delays the first paint and the Largest Contentful Paint. defer keeps their order and runs them after parsing; async runs them as soon as they arrive; a module defers by itself. This is read from the HTML — whether the delay is large depends on the scripts' size and the reader's network, which only field data measures.",
    sources: [SOURCE.mdnScript, SOURCE.optimizeLcp],
  },
  FONT_PRELOAD_WITHOUT_CROSSORIGIN: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Font preload without crossorigin',
    plain: {
      what: 'A web font is likely downloaded twice because of a setup slip',
      why: "Something in the page's code requests a font early in a way the browser can't reuse, so it downloads the font again. This is read from the code, not measured: it wastes bandwidth during loading and text waits for the second copy.",
      fix: 'Ask your developer to add the missing "crossorigin" setting to the font preload in the theme; it is a small change.',
    },
    hint: 'Add crossorigin to <link rel="preload" as="font">, even for a font on the same host.',
    explanation:
      'Fonts are always fetched in CORS mode, and MDN notes that preloading a font requires the crossorigin attribute. Without it the preloaded copy does not match the request the stylesheet later makes, so the browser downloads the font twice — the preload is wasted bandwidth at the moment the page is loading, and the text still waits for the second download.',
    sources: [SOURCE.mdnPreload],
  },
  BFCACHE_BLOCKED_BY_NO_STORE: {
    owner: 'crawl',
    severity: 'notice',
    label:
      'Cache-Control: no-store keeps the page out of the back/forward cache',
    plain: {
      what: 'Going back to this page likely reloads it instead of showing it instantly',
      why: "A server setting meant for private data likely stops browsers from keeping the page ready for the Back button, so it reloads from scratch. This is read from the server's answer, not measured; on phones, Back is one of the most common moves.",
      fix: 'Ask your developer or hosting provider to drop the "no-store" caching setting for public pages and keep it only for pages with personal data.',
    },
    hint: 'Serve public pages without no-store; keep it for responses that carry personal data.',
    explanation:
      'The page is served with Cache-Control: no-store. Browsers have historically refused to keep such pages in the back/forward cache, so pressing Back reloads the page from the network instead of restoring it instantly — and on mobile, Back is one of the most common navigations. no-store is meant for responses with sensitive data; a public blog post has none.',
    sources: [SOURCE.bfcache],
  },
  DOM_SIZE_LARGE: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Large DOM',
    plain: {
      what: 'The page is built from so many parts that it likely responds slowly to taps',
      why: "Something in the page's code is likely slowing it down: it has more than 1,400 building blocks, so each tap or click takes longer to show a result and phones use more memory. This is a count from the code, not a measurement.",
      fix: 'Ask your developer to trim unnecessary layers in the theme, load long lists and lower sections later, or split very long pages.',
    },
    hint: 'Trim wrappers, render long lists and below-the-fold sections lazily, or split the page.',
    explanation:
      'The HTML holds more elements than Lighthouse considers excessive (1,400). Every style recalculation and layout has to walk them, so a large DOM makes each interaction slower to paint — the delay Interaction to Next Paint measures — and costs memory on every phone that opens it. The count is of the HTML as served; scripts may add more.',
    sources: [SOURCE.domSize],
    max: 1_400,
  },
  HTML_NOT_COMPRESSED: {
    owner: 'crawl',
    severity: 'notice',
    label: 'HTML is not compressed',
    plain: {
      what: 'The server sends this page without compression',
      why: 'Compression typically makes a page several times smaller to download, so it reaches visitors faster and takes less of the time Google spends crawling the site.',
      fix: 'Your hosting provider, CDN or developer can turn on gzip or Brotli compression; it is usually a one-line server setting.',
    },
    hint: 'Enable gzip or Brotli for HTML responses on the server or CDN.',
    explanation:
      "The crawl asked for the page with Accept-Encoding: gzip, deflate, br — as Google's crawlers do — and the server answered uncompressed. Google's crawlers support all three encodings, and text compression typically shrinks HTML several times over, so the page downloads faster for readers and takes less of the time Google spends crawling the site. It is a server or CDN setting, usually a one-line change.",
    sources: [SOURCE.googleCrawlers, SOURCE.mdnCompression],
  },
  KEYWORD_CANNIBALISATION: {
    scope: 'run',
    owner: 'crawl',
    severity: 'warning',
    label: 'Two pages lead with the same keyword',
    plain: {
      what: 'Another page on the site leads with the same keyword as this one',
      why: "If both answer the same question they may compete for one search, with Google switching between them and links split. This is a sign, not proof: only real search data shows it, and this tracker's positions are simulated.",
      fix: 'The editor can compare the pages: if they say the same thing, merge them and ask your developer for a permanent redirect; if not, have the writer give each its own angle.',
    },
    hint: 'Check whether the pages answer the same question; if they do, merge them or retarget one.',
    explanation:
      "Two or more posts lead with the same keyword as this crawl extracts it from their text. That is a sign they may compete for one query, not proof: real cannibalisation is one query showing different URLs of the site in turn, which only search data can show, and this tracker's positions are simulated. When pages do compete, the choice between them can change from week to week and the links each earned are split instead of combined. Google has written no guidance under this name; the term and the remedy — merge with a 301 to the stronger page, or give each page its own intent — come from the SEO industry.",
    sources: [SOURCE.cannibalisation, SOURCE.canonical],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no keyword.',
  },
  TITLE_DUPLICATE: {
    scope: 'run',
    owner: 'crawl',
    severity: 'warning',
    label: 'Title is used by another page',
    plain: {
      what: 'Another page on the site has exactly the same title',
      why: 'In search results the two pages look the same, so searchers cannot tell which one answers their question. Google asks for a distinct title on every page.',
      fix: 'The writer or editor can give each page a title in the CMS that names what is specific to it.',
    },
    hint: 'Identical titles give search engines no way to tell the pages apart in results.',
    explanation:
      'Another page of this crawl has exactly the same <title>. Google asks for a distinct title on every page, and gives the example of a site whose pages are all titled alike, which makes them impossible to tell apart in results.',
    sources: [SOURCE.titleLinks],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no title.',
  },
  META_DESCRIPTION_DUPLICATE: {
    scope: 'run',
    owner: 'crawl',
    severity: 'notice',
    label: 'Meta description is used by another page',
    plain: {
      what: 'Another page on the site has exactly the same search summary',
      why: 'A summary that fits several pages describes each of them poorly, so it is less likely to earn the click. Google asks for a unique summary per page; summaries do not affect rankings.',
      fix: 'The writer can write a separate meta description for each page in the CMS or SEO plugin, describing what that page alone offers.',
    },
    hint: 'A description written for one page describes the others worse; write one per page.',
    explanation:
      'Another page of this crawl has exactly the same meta description. Google asks for a unique description for each page, since identical or similar descriptions are not helpful when the individual pages appear in results.',
    sources: [SOURCE.snippets],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no description.',
  },
  NEAR_DUPLICATE_CONTENT: {
    scope: 'run',
    owner: 'crawl',
    severity: 'warning',
    label: 'Nearly the same text as another page',
    plain: {
      what: 'Most of the text on this page also appears on another page of the site',
      why: 'Google shows only one of near-identical pages, so they compete for the same spot. Pages mass-produced from one template with a word swapped can be treated as spam.',
      fix: 'The editor can merge the pages (with a permanent redirect from your developer), or have the writer make each page say something the other does not.',
    },
    hint: 'Merge the pages, or make each one say something the other does not.',
    explanation:
      "Most of this page's main text also appears, nearly word for word, on another page of this crawl. Google groups near-duplicates and shows one of them, so the copies compete for one place; pages built from one template with a word swapped — a city, a product — are what Google's spam policies call doorway abuse. Quoting or syndication with a canonical is fine; two posts that say the same thing are not two answers.",
    sources: [SOURCE.canonical, SOURCE.spamPolicies],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has too little text to compare.',
  },
  STRUCTURED_DATA_INVALID: {
    owner: 'crawl',
    severity: 'warning',
    label: 'Structured data that cannot be read',
    plain: {
      what: "The page's hidden details for Google are broken and can't be read",
      why: 'Google ignores the whole block, so any article, breadcrumb or organization details in it count as missing. Structured data is optional, but a broken block gives you none of its benefit.',
      fix: "Ask your developer to fix the error in the block; Google's Rich Results Test points to the exact spot. If a plugin generates it, update or reconfigure the plugin.",
    },
    hint: 'Fix the JSON in the quoted block; Rich Results Test points at the exact character.',
    explanation:
      'A <script type="application/ld+json"> block on the page is not valid JSON, so nothing in it reaches Google: whatever article, breadcrumb or organization markup it holds counts as absent. Google asks for markup that passes its Rich Results Test. The usual causes are a trailing comma, an unescaped quote inside a value, or a template that printed an empty variable.',
    sources: [SOURCE.structuredDataPolicies, SOURCE.structuredDataIntro],
    skipReason: 'The page has no JSON-LD block.',
  },
  DATES_INCONSISTENT: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Dates contradict each other',
    plain: {
      what: "The page's publish and update dates contradict each other",
      why: 'Google shows a date beside results and asks for consistent dates. Given dates that cannot all be true, it has to pick one and may show the wrong one, making the post look older or newer than it is.',
      fix: 'The editor can correct the published and updated dates in the CMS so they agree with each other and with any year in the address; ask your developer if the template sets them.',
    },
    hint: 'Make the published date, the modified date and any year in the URL agree.',
    explanation:
      "The page's dates cannot all be true: the article was modified before it was published, it was published after the day it was crawled, or its URL carries a year the markup does not. Google asks for dates that are consistent, accurate and not in the future, and uses them for the date it shows beside the result — given a contradiction, it has to pick one, and may pick the wrong one.",
    sources: [SOURCE.bylineDates, SOURCE.articleMarkup],
    skipReason:
      'The page declares no publication date, or one that does not read as a date (ARTICLE_DATE_FORMAT_INVALID reports that).',
  },
  STRUCTURED_DATA_MISSING: {
    // The hint speaks about eligibility, never about a violation: Google requires no
    // structured data, and a hint implying otherwise manufactures urgency.
    owner: 'crawl',
    severity: 'notice',
    label: 'No article structured data',
    plain: {
      what: 'The page has no article details marked up for Google',
      why: 'This is optional, and Google requires none. Marking up the headline, author, date and image helps Google show them correctly, for example the date and image beside the result.',
      fix: 'An SEO plugin such as Yoast SEO can add article markup; otherwise ask your developer to add it to the post template.',
    },
    hint: 'Article or BlogPosting markup makes the post eligible for rich results; Google requires none.',
    explanation:
      'The page carries no JSON-LD typed Article, BlogPosting or NewsArticle. Structured data is optional; what it does is state facts Google would otherwise infer — the headline, the author, the publication date, the image — which helps Google show them correctly, for example the date and image beside the result.',
    sources: [SOURCE.articleMarkup, SOURCE.structuredDataIntro],
  },
  STRUCTURED_DATA_INCOMPLETE: {
    // Google's Article type has NO required properties — the documentation says to supply
    // what applies. So this cannot be a violation either, and the severity and the wording
    // follow STRUCTURED_DATA_MISSING: a missing recommended field costs eligibility for
    // part of the rich result, and nothing else. Skipped where there is no article node,
    // because that page is already failing the check above and would be told twice.
    owner: 'crawl',
    severity: 'notice',
    label: 'Article markup is missing recommended fields',
    plain: {
      what: "The page's article markup leaves out recommended details",
      why: 'None of these details is required, but each one missing, such as the image, dates or author, is something Google has to guess, like the date it shows or who it credits as the author.',
      fix: "Ask your developer to fill in the missing fields in the article markup, or check that your SEO plugin's author and image settings are complete.",
    },
    hint: 'Google recommends headline, image, datePublished, dateModified and author; it requires none of them.',
    explanation:
      'The article markup leaves out some of the properties Google recommends for Article: headline, image, datePublished, dateModified and author. None is required, but each one omitted is a fact Google has to guess — the date it shows, the author it attributes the post to — rather than read from you.',
    sources: [SOURCE.articleMarkup],
    skipReason: 'The page declares no article structured data.',
  },
  AUTHOR_MARKUP_INCOMPLETE: {
    // A notice, like the two article checks above: Google requires no author markup, so a
    // departure from its best practices costs attribution, never eligibility to rank.
    owner: 'crawl',
    severity: 'notice',
    label: 'Author markup is incomplete',
    plain: {
      what: 'The article details name the author in a way Google cannot fully use',
      why: 'Google uses the author in the markup to know who wrote the post. Without the type of author and a link to a page about them, or with several names or a title squeezed into one, it may credit the post wrongly or not at all.',
      fix: "Ask your developer, or check your SEO plugin's author settings, to give each author a profile page and to list every author separately with only their name.",
    },
    hint: 'Give each author @type Person or Organization, a url or sameAs, and only their name in name.',
    explanation:
      "Google's Article guidance asks, for each author: a @type of Person or Organization, a url (or sameAs) leading to a page that identifies them, only the name in name — no 'By', no job title, no publisher — and one author entry per author, never several names merged into one. The check reads the article's author as its markup states it, following an @id reference into the graph, and reports each departure: an author given as a bare string, one with no type or a type other than Person or Organization, no url or sameAs, a url that is the site's home page rather than a page about the author, or a name that reads as several people or carries a prefix.",
    sources: [SOURCE.articleMarkup],
    skipReason:
      'The article markup names no author, or nothing on the page does (AUTHOR_MISSING reports that).',
  },
  ARTICLE_DATE_FORMAT_INVALID: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Article dates are not in ISO 8601',
    plain: {
      what: 'The publish or update date in the article details is in a format Google may misread',
      why: 'Google reads these dates to show when a post was published. A date written like October 3, 2026, or a time without its time zone, can be misread or shifted by hours, so results may show the wrong day.',
      fix: 'Ask your developer to output datePublished and dateModified in ISO 8601 with a time zone, such as 2026-10-03T09:00:00+03:00; SEO plugins normally do this.',
    },
    hint: 'Write datePublished and dateModified in ISO 8601, with a time zone wherever a time is given.',
    explanation:
      "Google's Article guidance asks for datePublished and dateModified in ISO 8601 format with timezone information, and notes that without a time zone it reads the time in Googlebot's own. The check reads the dates the page declares — in its article markup, JSON-LD or Microdata, or its article:published_time and article:modified_time — and reports one that is not ISO 8601 at all — 03/10/2026, October 3, 2026 — and one that gives a time of day without an offset or Z. A date with no time (2026-10-03) passes: Google's byline guidance says the date is required and the time is not.",
    sources: [SOURCE.articleMarkup, SOURCE.bylineDates],
    skipReason: 'The page declares no publication or modification date.',
  },
  ARTICLE_HEADLINE_MISMATCH: {
    owner: 'crawl',
    severity: 'notice',
    label: 'Article headline does not match the page',
    plain: {
      what: 'The headline in the article details differs from the one on the page',
      why: 'Google asks that the details given to it match what readers see. A headline about something else, often a template filling in the site name, can be ignored, and the post loses the details it was meant to give.',
      fix: "Ask your developer, or check your SEO plugin's article settings, so the markup's headline is filled from the post's own title rather than a fixed, site-wide value.",
    },
    hint: "Fill headline from the post's title, as readers see it.",
    explanation:
      "The article markup's headline shares fewer than half its words with both the page's <title> and its <h1>. Google's structured data guidelines ask that markup describe content visible on the page and represent its main content, and its AI features guidance repeats that structured data should match the visible text. A shortened or reworded headline still shares most of its words and passes; what is reported is a headline about something else — usually a template printing the site's name, a category or a placeholder in every post.",
    sources: [SOURCE.structuredDataPolicies, SOURCE.aiFeatures],
    skipReason:
      'The article markup has no headline, or the page has neither a title nor an h1 to compare it with.',
  },
  BREADCRUMB_MISSING: {
    // A notice: Google documents the feature, but a page without it loses a display
    // option, not its place in results (plan D2).
    owner: 'crawl',
    severity: 'notice',
    label: 'No breadcrumb markup',
    plain: {
      what: "The page doesn't tell Google where it sits in the site",
      why: 'Google can show a breadcrumb trail such as Blog › SEO in place of the bare address, which tells a searcher what kind of page they are about to open. Without breadcrumb details on the page, Google shows the plain address instead.',
      fix: 'Turn on breadcrumbs in your SEO plugin (Yoast SEO and Rank Math both have them), or ask your developer to add BreadcrumbList structured data to the theme.',
    },
    hint: 'Add a BreadcrumbList in JSON-LD or Microdata.',
    explanation:
      "The page declares no BreadcrumbList, neither in JSON-LD (an @graph included) nor in Microdata. Google uses breadcrumb markup to categorise a page within its site and can show the trail in place of the URL in a result. The markup is optional and a page without it is not demoted; it only gives up the trail. RDFa is not read, so a trail declared only there is reported here. Whether a declared trail is complete is BREADCRUMB_INVALID's question.",
    sources: [SOURCE.breadcrumbMarkup],
  },
  BREADCRUMB_INVALID: {
    // A warning, as a broken JSON-LD block is: the markup is there and Google ignores it.
    owner: 'crawl',
    severity: 'warning',
    label: 'Breadcrumb markup is missing required fields',
    plain: {
      what: "The page's breadcrumb details for Google are incomplete",
      why: 'Google can show a breadcrumb trail in place of the bare address only when every step has its required details. With one missing it ignores the trail, and the result shows the plain address.',
      fix: "Ask your developer, or check your SEO plugin's breadcrumb settings, so every step has a name, a position and a link; Google's Rich Results Test points to the faulty step.",
    },
    hint: 'Give the BreadcrumbList two or more ListItems, each with position, name and item (item optional on the last).',
    explanation:
      'A BreadcrumbList on the page breaks one of the rules Google\'s breadcrumb documentation marks as required: at least two ListItems, each with an integer position and a name, and an item URL on every step but the last. A trail that fails them is not eligible for the breadcrumb Google can show in place of the URL. Each faulty step is quoted with what it lacks. A trail of a single step — the lone "Home" Yoast SEO writes on a home page — is not reported: there is no trail to show, and Google shows none.',
    sources: [SOURCE.breadcrumbMarkup, SOURCE.structuredDataPolicies],
    skipReason: 'The page declares no BreadcrumbList.',
  },
  CWV_LCP_NEEDS_IMPROVEMENT: {
    owner: 'pageSpeed',
    severity: 'notice',
    label: 'Largest Contentful Paint needs improvement',
    plain: {
      what: 'The main content is a bit slow to appear on phones',
      why: "On phones the page's main content takes over 2.5 seconds to appear, by Google's measurement. Speed is a small ranking signal; the bigger cost is visitors who leave before the page appears.",
      fix: 'Ask your developer to make the largest image or text block at the top the first thing the page loads, for example by compressing the image and loading it early.',
    },
    hint: 'The main image or text block takes longer than 2.5 s to appear; make it the first thing the page loads.',
    explanation:
      'Largest Contentful Paint (LCP) is how long the largest image or text block in the viewport takes to appear — the moment a visitor sees that the page has loaded. Google calls 2.5 s or less good and more than 4 s poor, judged at the 75th percentile of mobile visits. The value comes from PageSpeed Insights: real Chrome visitors to this page over the last 28 days where Google has enough of them, otherwise visitors to the whole site, otherwise one lab test. Google says it shows the most relevant content even when page experience is sub-par, so this is a small ranking signal; the larger cost is visitors who leave before the page appears.',
    sources: [SOURCE.lcp, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.lcp.good,
  },
  CWV_LCP_POOR: {
    owner: 'pageSpeed',
    severity: 'warning',
    label: 'Largest Contentful Paint is poor',
    plain: {
      what: 'The main content takes too long to appear on phones',
      why: "On phones the main content takes over 4 seconds to appear, by Google's measurement, and many visitors leave before it does. Google counts it as a small ranking signal; the bigger loss is visitors.",
      fix: 'Ask your developer to shrink and preload the largest image or text block at the top, and to remove scripts that hold back the first paint.',
    },
    hint: 'The main image or text block takes longer than 4 s to appear; shrink it, serve it sooner, and drop what blocks it.',
    explanation:
      "Largest Contentful Paint (LCP) is how long the largest image or text block in the viewport takes to appear. More than 4 s at the 75th percentile of mobile visits is Google's poor band: a quarter of visitors wait at least that long to see the page. The value comes from PageSpeed Insights — real visitors to this page, to the whole site when the page has too few, or one lab test. The usual causes are an oversized hero image, a slow server response, and scripts or stylesheets that hold back the first paint. Google shows the most relevant content even when page experience is sub-par, so the cost is mostly in visitors who give up.",
    sources: [SOURCE.lcp, SOURCE.optimizeLcp, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.lcp.poor,
  },
  CWV_INP_NEEDS_IMPROVEMENT: {
    owner: 'pageSpeed',
    severity: 'notice',
    label: 'Interaction to Next Paint needs improvement',
    plain: {
      what: 'The page is a little slow to respond to taps and clicks',
      why: 'Data from real Chrome visitors shows at least a quarter of mobile visits wait over 0.2 seconds for the page to react to a tap or click. It is a small ranking signal; to visitors, a lagging page feels less reliable.',
      fix: 'Ask your developer to find and break up the long-running scripts that run while visitors use the page, including third-party ones.',
    },
    hint: 'Taps and clicks take longer than 200 ms to show a response; break up long scripts that run while the page is in use.',
    explanation:
      "Interaction to Next Paint (INP) is how long the page takes to respond visibly to a tap, click or key press, taken across the visit. Google calls 200 ms or less good and more than 500 ms poor, at the 75th percentile of mobile visits. Only real visitors measure it — a lab test loads the page but never uses it — so this value is Chrome's field data for this page, or for the whole site when the page has too few visits. It is a small ranking signal; to a visitor, a page that lags after a tap feels broken.",
    sources: [SOURCE.inp, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.inp.good,
  },
  CWV_INP_POOR: {
    owner: 'pageSpeed',
    severity: 'warning',
    label: 'Interaction to Next Paint is poor',
    plain: {
      what: 'The page responds sluggishly to taps and clicks',
      why: 'Data from real Chrome visitors shows at least a quarter of mobile visits wait over half a second for a response. Page experience is a small ranking signal; the bigger loss is visitors who tap, see nothing happen, and leave.',
      fix: 'Ask your developer to find the scripts that block the page after it loads, often heavy third-party tools, and remove, delay or split them.',
    },
    hint: 'Taps and clicks take longer than 500 ms to show a response; find the scripts that block the page after it loads.',
    explanation:
      "Interaction to Next Paint (INP) is how long the page takes to respond visibly to a tap, click or key press. More than 500 ms at the 75th percentile of mobile visits is Google's poor band. The value is Chrome's field data for this page, or for the whole site when the page has too few visits — a lab test cannot measure it, because it never interacts with the page. Heavy third-party scripts, large pages and long tasks on the main thread are the usual causes. Page experience is a small ranking signal next to relevance; the bigger cost is visitors who tap, see nothing happen, and leave.",
    sources: [SOURCE.inp, SOURCE.domSize, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.inp.poor,
  },
  CWV_CLS_NEEDS_IMPROVEMENT: {
    owner: 'pageSpeed',
    severity: 'notice',
    label: 'Cumulative Layout Shift needs improvement',
    plain: {
      what: 'Content shifts around somewhat while the page loads',
      why: 'Text that moves as images or ads load above it makes some readers lose their place or tap the wrong thing. Google treats it as a small ranking signal; it is mainly a reading-experience problem.',
      fix: 'Ask your developer to reserve space in the theme for images, embeds and ads, so the content stays put while they load.',
    },
    hint: 'Content moves while the page loads; reserve space for images, embeds and ads before they arrive.',
    explanation:
      'Cumulative Layout Shift (CLS) scores how much visible content jumps around while the page is open — the text you were reading sliding down as an image or an ad loads above it. It is a unitless score: Google calls 0.1 or less good and more than 0.25 poor, at the 75th percentile of mobile visits. The value comes from PageSpeed Insights — real visitors to this page, to the whole site when the page has too few, or one lab test, which only sees shifts during loading. It is a small ranking signal; to a reader, it is mis-taps and a lost place.',
    sources: [SOURCE.cls, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.cls.good,
  },
  CWV_CLS_POOR: {
    owner: 'pageSpeed',
    severity: 'warning',
    label: 'Cumulative Layout Shift is poor',
    plain: {
      what: 'The layout jumps a lot while visitors are reading',
      why: "By Google's measurement, content on phones jumps enough that people tap the wrong thing or lose their place. Google weighs page experience after relevance, so the main cost is frustrated readers, not rankings.",
      fix: 'Ask your developer to give images and embeds fixed sizes, stop banners and ads from pushing content down, and check web fonts that reflow the text.',
    },
    hint: 'Content jumps a lot while the page loads; give images and embeds fixed dimensions and stop inserting content above what is being read.',
    explanation:
      "Cumulative Layout Shift (CLS) scores how much visible content jumps around while the page is open. More than 0.25 at the 75th percentile of mobile visits is Google's poor band. The usual causes are images and embeds without width and height, ads and banners injected above the content, and web fonts that reflow the text. The value comes from PageSpeed Insights — real visitors to this page, to the whole site, or one lab test. Google weighs page experience after relevance, so the main cost is readers who tap the wrong thing or lose their place.",
    sources: [SOURCE.cls, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.cls.poor,
  },
} as const satisfies Record<string, ISeoIssueDefinition>;

export type TSeoIssueCode = keyof typeof SEO_ISSUE_CATALOGUE;

export const SEO_ISSUE_CODES = Object.keys(
  SEO_ISSUE_CATALOGUE,
) as TSeoIssueCode[];

/**
 * The catalogue split by owner. Derived from the entries, so a code is in exactly one set
 * and neither can drift from the catalogue. Each writer's replace deletes only its own
 * set: the crawl cannot erase a measurement's findings, nor the worker a crawl's.
 */
export type TPageSpeedIssueCode = {
  [K in TSeoIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends {
    owner: 'pageSpeed';
  }
    ? K
    : never;
}[TSeoIssueCode];

export type TCrawlIssueCode = Exclude<TSeoIssueCode, TPageSpeedIssueCode>;

export const PAGE_SPEED_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => SEO_ISSUE_CATALOGUE[code].owner === 'pageSpeed',
) as TPageSpeedIssueCode[];

export const CRAWL_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => SEO_ISSUE_CATALOGUE[code].owner === 'crawl',
) as TCrawlIssueCode[];

/**
 * The crawl's codes split by what a check can see. Derived from the entries, so a code is
 * in exactly one of them and neither list can drift from the catalogue.
 *
 * The split is what decides a check's SHAPE from its code rather than from the check:
 * a run code's unit takes the whole crawl and answers once per page, every other code's
 * takes one page. So the wrong shape under a code is a compile error, not a check that
 * runs and never fires — which is what it would be, since "is another page using this
 * title" cannot be answered from one page at all.
 */
export type TRunIssueCode = {
  [K in TCrawlIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends {
    scope: 'run';
  }
    ? K
    : never;
}[TCrawlIssueCode];

export type TPageIssueCode = Exclude<TCrawlIssueCode, TRunIssueCode>;

export const RUN_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) => 'scope' in SEO_ISSUE_CATALOGUE[code],
) as TRunIssueCode[];

export const PAGE_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) => !('scope' in SEO_ISSUE_CATALOGUE[code]),
) as TPageIssueCode[];

/**
 * The codes a crawl runs and a screen lists as checks — the crawl's codes minus what
 * `enabled: false` has retired. The speed codes are never here: no crawl runs them, and
 * they count in neither a page's checks nor its score.
 *
 * Both sides iterate THIS, never `SEO_ISSUE_CODES`: the analysis so a retired check
 * produces no verdict, and `composePageChecks` so it produces no row. Lookups by code
 * keep using the catalogue itself, which is the point of retiring rather than deleting —
 * a finding stored under a retired code still has a label, a hint and a severity to be
 * rendered with.
 *
 * A page crawled before a check was retired keeps it in its stored denominator, so its
 * score counts a check the list no longer shows. That is the same arrangement a page
 * already has with a check added after it was crawled, and it is why the score is
 * explained as what applied WHEN THE PAGE WAS CRAWLED; the next crawl settles it.
 */
export const ACTIVE_ISSUE_CODES = CRAWL_ISSUE_CODES.filter(
  (code) => !('enabled' in SEO_ISSUE_CATALOGUE[code]),
);
