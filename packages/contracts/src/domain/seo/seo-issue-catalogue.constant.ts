import type { TSeoIssueSeverity } from './seo-issue-severity.enum.js';

/** A page that backs a check's claim, named for the reader as its publisher names it. */
export interface ISeoIssueSource {
  title: string;
  url: string;
}

export interface ISeoIssueDefinition {
  severity: TSeoIssueSeverity;
  /** Short, shown as the issue's name. */
  label: string;
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
const SOURCE = {
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
  structuredDataIntro: {
    title: 'Google Search Central: Introduction to structured data markup',
    url: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
  },
} as const satisfies Record<string, ISeoIssueSource>;

/**
 * Every SEO issue the analysis can report — the backend's checks are typed by these
 * keys, so a code without a check does not compile, and the frontend renders labels and
 * hints from here. Thresholds live here too: the check and the screen quote one number.
 */
export const SEO_ISSUE_CATALOGUE = {
  TITLE_MISSING: {
    severity: 'error',
    label: 'Title is missing',
    hint: 'Search results show the title as the headline; add a <title> in <head>.',
    explanation:
      'The <title> element is the first source Google reads for the headline of a search result (its "title link"). Without one, Google builds the headline itself from headings, anchor text or other text on the page, and the result may not say what the page is about. Google asks for a title on every page, written to describe that page specifically.',
    sources: [SOURCE.titleLinks],
  },
  TITLE_LENGTH: {
    // A notice, not a warning: exceeding the bounds costs space in a result, it does not
    // break the page (plan D4). The numbers are unchanged; industry consensus confirms them.
    severity: 'notice',
    label: 'Title length',
    hint: 'Titles outside 30–60 characters are cut off or waste the space in results.',
    explanation:
      "Google does not publish a length limit; it truncates a title link to fit the width of the result, and asks for titles that are descriptive and concise rather than vague or stuffed. The 30–60 character range is the audit industry's working approximation of that width: longer titles tend to be cut mid-phrase, and very short ones often leave out what distinguishes the page. Treat this as a prompt to reread the title, not as a rule Google enforces.",
    sources: [SOURCE.titleLinks],
    min: 30,
    max: 60,
    skipReason: 'No title to measure.',
  },
  META_DESCRIPTION_MISSING: {
    severity: 'warning',
    label: 'Meta description is missing',
    hint: 'Without one, search engines pick a snippet from the page themselves.',
    explanation:
      'The meta description is not a ranking factor, but Google may use it as the snippet under the headline in a search result when it describes the page better than any passage of the text. Without one, the snippet is always an excerpt Google picks, which for a long article may be a passage out of context. A short, accurate summary written for this page is what Google recommends.',
    sources: [SOURCE.snippets],
  },
  META_DESCRIPTION_LENGTH: {
    severity: 'notice',
    label: 'Meta description length',
    hint: 'Descriptions outside 70–160 characters are cut off or look thin.',
    explanation:
      "Google sets no length limit for meta descriptions; snippets are truncated to the space the result has, which depends on the device. The 70–160 character range is the audit industry's approximation of that space: a longer description is cut, and a much shorter one rarely says enough for Google to prefer it over a passage from the page.",
    sources: [SOURCE.snippets],
    min: 70,
    max: 160,
    skipReason: 'No description to measure.',
  },
  H1_MISSING: {
    // A warning, not an error, by the line ranking-signals.md draws: an error is for what
    // keeps a page out of the running, and Google states heading structure does not
    // matter to Search. A page without an h1 is indexed and ranked.
    severity: 'warning',
    label: 'H1 is missing',
    hint: 'The main heading tells readers and crawlers what the page is about.',
    explanation:
      "The <h1> is the page's main heading: readers and screen readers use it to confirm they are on the page they expected, and Google lists headings among the sources it reads to understand a page and to build its title link. A post whose title is styled as a <div> or an <h2> loses that signal while looking unchanged to a sighted reader.",
    sources: [SOURCE.starterGuide, SOURCE.mdnHeadings],
  },
  H1_MULTIPLE: {
    severity: 'warning',
    label: 'More than one H1',
    hint: 'Several main headings blur what the page is about; keep one.',
    explanation:
      'The HTML standard no longer allows several <h1> elements to describe one document, and MDN advises one per page: a page with several main headings tells screen-reader users that it is about several things. Google says it copes with any heading structure, so the cost is clarity for readers and assistive technology rather than a ranking penalty.',
    sources: [SOURCE.mdnHeadings, SOURCE.starterGuide],
  },
  HEADING_SKIP: {
    severity: 'notice',
    label: 'Heading level skipped',
    hint: 'Going from H2 straight to H4 breaks the outline that headings describe.',
    explanation:
      "Headings form an outline that screen-reader users navigate by, and a jump from <h2> to <h4> tells them a level is missing. MDN asks never to skip heading levels. Google's own guidance is explicit that heading order does not matter to Search, so this is an accessibility and readability finding, not a ranking one.",
    sources: [SOURCE.mdnHeadings, SOURCE.starterGuide],
    skipReason: 'Fewer than two headings — no outline to judge.',
  },
  CANONICAL_MISSING: {
    severity: 'warning',
    label: 'Canonical URL is missing',
    hint: 'A canonical link says which URL should rank when copies exist.',
    explanation:
      'The same post is often reachable at several URLs — with and without a trailing slash, with tracking parameters, through a category path. Google groups such copies and picks one to show; a rel="canonical" link in <head> (or a Link HTTP header) is the strongest hint you control about which one. Without it Google picks by itself, and links pointing at the other copies may be credited to a URL you did not choose. Google only accepts the canonical from <head>: one written in <body> is ignored.',
    sources: [SOURCE.canonical, SOURCE.canonicalRfc],
  },
  CANONICAL_MISMATCH: {
    severity: 'notice',
    label: 'Canonical points elsewhere',
    hint: 'The page names another URL as canonical, so this one may not be indexed.',
    explanation:
      'This page tells Google that another URL is the preferred version of its content, so Google will usually index that URL and leave this one out of results. That is correct when the page really is a copy; on an original post it is usually a template bug — a canonical built from the wrong variable, or pointing to the HTTP or the www version. The sitemap listing this URL while the page names another one is itself a conflicting signal.',
    sources: [SOURCE.canonical, SOURCE.sitemaps],
    skipReason: 'No canonical to disagree with.',
  },
  CANONICAL_CONFLICT: {
    // A warning: conflicting canonicals leave the page where CANONICAL_MISSING would — a
    // warning — however confident each tag looks on its own.
    severity: 'warning',
    label: 'Conflicting canonical URLs',
    hint: 'Declare one canonical URL, in one place; canonicals that disagree are no signal at all.',
    explanation:
      'The page names more than one canonical URL — two <link rel="canonical"> tags, or a tag and a Link header that disagree. Google asks you not to specify different canonical URLs for the same page, and a hint that contradicts itself cannot be followed: Google then chooses the canonical by its own signals. This usually comes from a theme and an SEO plugin each adding their own tag.',
    sources: [SOURCE.canonical],
    skipReason: 'No canonical to disagree with.',
  },
  NOINDEX: {
    severity: 'error',
    label: 'Page is set to noindex',
    hint: 'A robots meta tag or X-Robots-Tag header keeps the page out of search results.',
    explanation:
      'A noindex rule — in a <meta name="robots"> or <meta name="googlebot"> tag, or in an X-Robots-Tag HTTP header — tells Google to drop the page from search results, and Google obeys it once it recrawls the page. On a post listed in the blog sitemap it is almost always unintended: a staging setting left on, or a plugin rule for a category applied too widely. A sitemap entry and a noindex on the same URL are also contradictory signals.',
    sources: [SOURCE.blockIndexing, SOURCE.robotsMeta],
  },
  SNIPPET_RESTRICTED: {
    severity: 'notice',
    label: 'Search snippet is restricted',
    hint: 'Remove nosnippet or max-snippet:0 unless hiding the text from results is the intent.',
    explanation:
      'A nosnippet or max-snippet:0 rule — in a robots or googlebot meta tag, or an X-Robots-Tag header — tells Google to show no text from the page under its result, and Google applies the same controls to its AI features: the page cannot be quoted in an AI Overview. Sometimes that is the point; on a blog post that wants readers it usually is not, and a result with no description draws fewer clicks.',
    sources: [SOURCE.robotsMeta, SOURCE.aiFeatures],
  },
  ROBOTS_BLOCKS_GOOGLEBOT: {
    // An error by the line ranking-signals.md draws: a page Googlebot may not fetch is out
    // of the running, exactly like a noindexed one.
    severity: 'error',
    label: 'robots.txt blocks Googlebot',
    hint: 'Remove or narrow the Disallow rule that matches this URL for Googlebot.',
    explanation:
      "The site's robots.txt forbids Googlebot from fetching this URL, so Google cannot read the page's content and cannot rank it on that content. The URL can still appear in results — robots.txt blocks crawling, not indexing — but without a description, known only from what other pages say about it. This tracker obeys robots.txt under its own name, which is why it could read the page; Googlebot obeys the group addressed to it, and that group says no.",
    sources: [SOURCE.robotsIntro, SOURCE.robotsSpec, SOURCE.robotsRfc],
    skipReason: "The site's robots.txt does not govern this page's host.",
  },
  ROBOTS_BLOCKS_RESOURCES: {
    severity: 'warning',
    label: 'robots.txt blocks scripts or styles',
    hint: 'Allow Googlebot to fetch the CSS and JavaScript the page needs to render.',
    explanation:
      "Google renders a page in a headless Chrome before indexing it, fetching every script and stylesheet as Googlebot and obeying robots.txt — and it states that it will not render JavaScript from blocked files. A blocked stylesheet can make the page look broken or unfit for mobile to Google; a blocked script can leave out whatever that script puts on the page. Only resources on the site's own host are judged, because only its robots.txt was read.",
    sources: [SOURCE.javascriptSeo, SOURCE.robotsIntro],
    skipReason:
      "The page loads no scripts or stylesheets from a host the site's robots.txt governs.",
  },
  ROBOTS_BLOCKS_AI_SEARCH: {
    severity: 'notice',
    label: 'robots.txt blocks AI search crawlers',
    hint: 'Allow the search crawlers of the assistants you want to be cited by; their training crawlers are a separate choice.',
    explanation:
      'robots.txt keeps one or more search crawlers of AI assistants from this page — OAI-SearchBot (ChatGPT search), PerplexityBot, or Bingbot, whose index Copilot answers from. OpenAI documents that a site opted out of OAI-SearchBot is not shown in ChatGPT search answers, and Perplexity asks sites to allow PerplexityBot to appear in its results. This is not about training: GPTBot and Google-Extended govern training and are not judged here, because closing them is a legitimate choice that costs no visibility. It does not affect Google Search.',
    sources: [SOURCE.openAiBots, SOURCE.perplexityBots, SOURCE.bingCrawlers],
    skipReason: "The site's robots.txt does not govern this page's host.",
  },
  IMAGES_MISSING_ALT: {
    severity: 'warning',
    label: 'Images without alt text',
    hint: 'Alt text describes an image to screen readers and image search.',
    explanation:
      'Alt text is what a screen reader announces in place of an image and what a browser shows when the image fails to load. Google calls it the most important attribute for providing metadata about an image, and uses it together with the surrounding text for image search. An image that carries no information should have an empty alt="" so assistive technology skips it; an image without the attribute at all leaves the reader to guess.',
    sources: [SOURCE.images, SOURCE.waiImages],
    skipReason: 'The page has no images.',
  },
  THIN_CONTENT: {
    // A notice: Google says it has no preferred word count, so a short page is a prompt
    // to reread it, not a defect on the page.
    severity: 'notice',
    label: 'Thin content',
    hint: 'Posts under 300 words rarely answer a query well enough to rank.',
    explanation:
      "Google says plainly that it has no preferred word count, and a short page that fully answers its question is fine. The 300-word line is an audit heuristic, not a Google rule: below it a blog post is more often a stub, a teaser for another page or a placeholder than a complete answer, and Google's guidance asks whether a page provides substantial, complete value compared with others on the topic. Read the page and decide whether it says everything a searcher needs.",
    sources: [SOURCE.helpfulContent],
    min: 300,
  },
  AUTHOR_MISSING: {
    severity: 'notice',
    label: 'No author named',
    hint: 'Name the author on the page and in the article markup, linked to a page about them.',
    explanation:
      'Nothing on the page says who wrote it: no author in the article markup, no <meta name="author">, no rel="author" link and no byline the markup identifies. Google\'s guidance on helpful content asks "who created the content" first and suggests a byline linking to more about the author — it helps readers judge the expertise behind a post. It is not a ranking switch: adding a name does not add expertise, but hiding who wrote a post takes away a reason to trust it.',
    sources: [SOURCE.helpfulContent, SOURCE.articleMarkup],
  },
  DATE_BUMPED_WITHOUT_CHANGES: {
    severity: 'warning',
    label: 'Date changed, content did not',
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
    severity: 'notice',
    label: 'Content links nowhere on the site',
    hint: 'Links written into the text carry readers and crawlers on to the pages they name.',
    explanation:
      "Google finds pages and learns how they relate mainly by following links, and reads a link's anchor text as a description of the page it points to. A post whose text never links to another page on the same site passes none of that on. Links to a heading of this same page (a table of contents) do not count, since they lead nowhere new; nor do the navigation, related-posts rail and footer, which are not what the author wrote.",
    sources: [SOURCE.crawlableLinks, SOURCE.starterGuide],
  },
  INTERNAL_LINKS_NOFOLLOW: {
    severity: 'notice',
    label: 'Internal links marked nofollow',
    hint: 'Drop rel="nofollow" from links to your own pages; use robots.txt to keep a page from being crawled.',
    explanation:
      'rel="nofollow" asks Google not to associate your site with the linked page and not to crawl it from yours. Google reserves it for links you do not vouch for, and for links within your own site points to robots.txt instead. On a link to your own post it only withholds what the link would have told Google about that page — usually a template or a plugin adding the attribute to every link indiscriminately.',
    sources: [SOURCE.qualifyLinks],
    skipReason: 'The content links nowhere on the site.',
  },
  INTERNAL_LINK_VARIANTS: {
    severity: 'notice',
    label: 'Internal links to non-canonical URLs',
    hint: 'Link to the URL the site actually serves: same scheme, same host, no tracking parameters.',
    explanation:
      'The content links to pages of this site through a different URL than the one this page is served at — plain HTTP from an HTTPS page, the www host from a site served without it (or the other way round), or a URL carrying tracking or session parameters. Each such link costs a redirect or creates a duplicate URL for Google to crawl and fold back into the canonical one. Google asks sites to link internally to the canonical URL rather than a duplicate, and to avoid session IDs in URLs.',
    sources: [SOURCE.canonical, SOURCE.urlStructure],
    skipReason: 'The content links nowhere on the site.',
  },
  UNCRAWLABLE_LINKS: {
    severity: 'notice',
    label: 'Links Google cannot follow',
    hint: 'Give every link a real URL in href; keep JavaScript for behaviour on top of it.',
    explanation:
      'Google states that it can generally only crawl a link if it is an <a> element with an href attribute that resolves to a real web address. An <a> that navigates through onclick with no href, or whose href is a javascript: call, works for a reader with a mouse and is a dead end for a crawler: the page it leads to is not discovered through it and receives none of its anchor text.',
    sources: [SOURCE.crawlableLinks],
  },
  LANG_MISSING: {
    severity: 'notice',
    label: 'Language is not declared',
    hint: 'Add lang to <html> so browsers, screen readers and translation tools read the page right.',
    explanation:
      "Google determines a page's language from its visible text and states that it does not use the lang attribute, so this does not affect Google rankings. It still matters to readers: screen readers choose pronunciation by it, browsers offer translation and hyphenate by it, and WCAG 2.2 requires the page's language to be declared (success criterion 3.1.1).",
    sources: [SOURCE.wcagLanguage, SOURCE.multiRegional],
  },
  HREFLANG_INVALID: {
    // Reciprocity — does the page named back link here — is the other half of Google's
    // requirement and is deliberately not checked: it needs the other document, which
    // is usually on another site and never in this crawl. What is checked is what one
    // page can answer about itself.
    severity: 'notice',
    label: 'Hreflang is malformed',
    hint: 'A hreflang with an invalid language code, or that never names this page, is ignored.',
    explanation:
      'hreflang links tell Google which URL to show readers of each language or region. Google requires each value to be a valid ISO 639-1 language code, optionally followed by an ISO 3166-1 region, and requires each page of the set to list itself as well as the others; annotations that break these rules may be ignored, and readers shown the wrong language version.',
    sources: [SOURCE.hreflang],
    skipReason: 'The page declares no hreflang.',
  },
  VIEWPORT_MISSING: {
    // A warning and not an error, by the line ranking-signals.md draws: an error is for
    // what keeps a page out of the running — unreachable, noindexed, canonicalised away.
    // A page without a viewport is indexed; it is just indexed as rendered on a phone.
    severity: 'warning',
    label: 'No mobile viewport',
    hint: 'Google indexes the mobile version; without a viewport the page renders at desktop width on a phone.',
    explanation:
      'Google indexes and ranks the version of a page its smartphone crawler sees. Without <meta name="viewport" content="width=device-width, initial-scale=1">, mobile browsers lay the page out at a desktop width (typically 980 px) and shrink it to fit, so text is tiny and readers have to zoom.',
    sources: [SOURCE.mobileFirst, SOURCE.mdnViewport],
  },
  OG_TAGS_MISSING: {
    severity: 'notice',
    label: 'Open Graph tags missing',
    hint: 'og:title, og:description and og:image control how shared links look.',
    explanation:
      'Open Graph tags decide the title, description and image shown when the post is shared on social networks and in messengers. They do not affect Google rankings. Without them each platform guesses, and a shared link often shows the site logo or no image at all.',
    sources: [SOURCE.openGraph],
  },
  NOT_HTTPS: {
    severity: 'error',
    label: 'Not served over HTTPS',
    hint: 'Browsers mark plain HTTP pages as not secure, and search engines prefer HTTPS.',
    explanation:
      'The page was served over plain HTTP. Browsers label such pages "Not secure" and traffic to them can be read and altered on the way — the reason this is an error is the reader\'s trust, not rankings: Google has counted HTTPS since 2014, but announced it as a very lightweight signal. Serve every page over HTTPS and redirect HTTP to it permanently.',
    sources: [SOURCE.httpsSignal, SOURCE.enableHttps],
  },
  MIXED_CONTENT: {
    // Skipped rather than passed on an http page: there is no mixing, and passing would
    // reward the page for the very thing NOT_HTTPS is failing it for.
    severity: 'warning',
    label: 'Insecure resources on a secure page',
    hint: 'Browsers block images and scripts fetched over plain HTTP on an HTTPS page; serve them over HTTPS.',
    explanation:
      "The page is served over HTTPS but loads some resources over plain HTTP. Browsers block insecure scripts, stylesheets and frames on a secure page outright and upgrade or flag insecure images, so parts of the page may be missing for readers — and for Google's renderer, which is a Chrome browser. The padlock is lost as well.",
    sources: [SOURCE.mixedContent, SOURCE.mdnMixedContent],
    skipReason: 'The page is not served over HTTPS, so nothing is mixed.',
  },
  REDIRECTED: {
    severity: 'notice',
    label: 'Sitemap URL redirects',
    hint: 'The sitemap lists a URL that redirects; list the final URL instead.',
    explanation:
      'A sitemap should list the canonical URLs you want shown in results. This entry redirects, so every crawl of it costs an extra request and the sitemap names a URL that is not the one you want indexed. The status matters too: Google shows the target of a permanent redirect (301, 308) in results, but keeps showing the source of a temporary one (302, 307).',
    sources: [SOURCE.sitemaps, SOURCE.redirects],
  },
  META_REFRESH: {
    severity: 'warning',
    label: 'Redirects with a meta refresh',
    hint: 'Google asks for a server-side 301; a meta refresh is slower and states the move less clearly.',
    explanation:
      'The page moves readers on with <meta http-equiv="refresh">. Google understands it — an instant refresh as a permanent redirect, a delayed one as a temporary one — but ranks it below server-side redirects for how reliably the move is interpreted, and suggests it only where a server-side redirect is not possible. Readers see the old page flash first, and other crawlers may not follow it at all.',
    sources: [SOURCE.redirects],
  },
  LARGE_PAGE: {
    severity: 'notice',
    label: 'Large HTML',
    hint: 'HTML over 1 MB is slow to download and parse; Googlebot reads only the first 2 MB.',
    explanation:
      'When crawling for Google Search, Googlebot reads only the first 2 MB of an HTML file; anything past that is never indexed. This check fires at half that, while there is still room to act. Most pages this large carry a big inline data blob — framework hydration state, embedded SVGs, base64 images — ahead of the text, and the same weight slows every reader on a mobile connection.',
    sources: [SOURCE.googlebot],
    max: 1_048_576,
  },
  HTML_NOT_COMPRESSED: {
    severity: 'notice',
    label: 'HTML is not compressed',
    hint: 'Enable gzip or Brotli for HTML responses on the server or CDN.',
    explanation:
      "The crawl asked for the page with Accept-Encoding: gzip, deflate, br — as Google's crawlers do — and the server answered uncompressed. Google's crawlers support all three encodings, and text compression typically shrinks HTML several times over, so the page downloads faster for readers and takes less of the time Google spends crawling the site. It is a server or CDN setting, usually a one-line change.",
    sources: [SOURCE.googleCrawlers, SOURCE.mdnCompression],
  },
  KEYWORD_CANNIBALISATION: {
    scope: 'run',
    severity: 'warning',
    label: 'Two pages lead with the same keyword',
    hint: 'Check whether the pages answer the same question; if they do, merge them or retarget one.',
    explanation:
      "Two or more posts lead with the same keyword as this crawl extracts it from their text. That is a sign they may compete for one query, not proof: real cannibalisation is one query showing different URLs of the site in turn, which only search data can show, and this tracker's positions are simulated. When pages do compete, the choice between them can change from week to week and the links each earned are split instead of combined. Google has written no guidance under this name; the term and the remedy — merge with a 301 to the stronger page, or give each page its own intent — come from the SEO industry.",
    sources: [SOURCE.cannibalisation, SOURCE.canonical],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no keyword.',
  },
  TITLE_DUPLICATE: {
    scope: 'run',
    severity: 'warning',
    label: 'Title is used by another page',
    hint: 'Identical titles give search engines no way to tell the pages apart in results.',
    explanation:
      'Another page of this crawl has exactly the same <title>. Google asks for a distinct title on every page, and gives the example of a site whose pages are all titled alike, which makes them impossible to tell apart in results.',
    sources: [SOURCE.titleLinks],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no title.',
  },
  META_DESCRIPTION_DUPLICATE: {
    scope: 'run',
    severity: 'notice',
    label: 'Meta description is used by another page',
    hint: 'A description written for one page describes the others worse; write one per page.',
    explanation:
      'Another page of this crawl has exactly the same meta description. Google asks for a unique description for each page, since identical or similar descriptions are not helpful when the individual pages appear in results.',
    sources: [SOURCE.snippets],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has no description.',
  },
  NEAR_DUPLICATE_CONTENT: {
    scope: 'run',
    severity: 'warning',
    label: 'Nearly the same text as another page',
    hint: 'Merge the pages, or make each one say something the other does not.',
    explanation:
      "Most of this page's main text also appears, nearly word for word, on another page of this crawl. Google groups near-duplicates and shows one of them, so the copies compete for one place; pages built from one template with a word swapped — a city, a product — are what Google's spam policies call doorway abuse. Quoting or syndication with a canonical is fine; two posts that say the same thing are not two answers.",
    sources: [SOURCE.canonical, SOURCE.spamPolicies],
    skipReason:
      'Nothing to compare — the run holds one page, or this page has too little text to compare.',
  },
  STRUCTURED_DATA_MISSING: {
    // The hint speaks about eligibility, never about a violation: Google requires no
    // structured data, and a hint implying otherwise manufactures urgency.
    severity: 'notice',
    label: 'No article structured data',
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
    severity: 'notice',
    label: 'Article markup is missing recommended fields',
    hint: 'Google recommends headline, image, datePublished, dateModified and author; it requires none of them.',
    explanation:
      'The article markup leaves out some of the properties Google recommends for Article: headline, image, datePublished, dateModified and author. None is required, but each one omitted is a fact Google has to guess — the date it shows, the author it attributes the post to — rather than read from you.',
    sources: [SOURCE.articleMarkup],
    skipReason: 'The page declares no article structured data.',
  },
} as const satisfies Record<string, ISeoIssueDefinition>;

export type TSeoIssueCode = keyof typeof SEO_ISSUE_CATALOGUE;

export const SEO_ISSUE_CODES = Object.keys(
  SEO_ISSUE_CATALOGUE,
) as TSeoIssueCode[];

/**
 * The catalogue split by what a check can see. Derived from the entries, so a code is
 * in exactly one of them and neither list can drift from the catalogue.
 *
 * The split is what decides a check's SHAPE from its code rather than from the check:
 * a run code's unit takes the whole crawl and answers once per page, every other code's
 * takes one page. So the wrong shape under a code is a compile error, not a check that
 * runs and never fires — which is what it would be, since "is another page using this
 * title" cannot be answered from one page at all.
 */
export type TRunIssueCode = {
  [K in TSeoIssueCode]: (typeof SEO_ISSUE_CATALOGUE)[K] extends {
    scope: 'run';
  }
    ? K
    : never;
}[TSeoIssueCode];

export type TPageIssueCode = Exclude<TSeoIssueCode, TRunIssueCode>;

export const RUN_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => 'scope' in SEO_ISSUE_CATALOGUE[code],
) as TRunIssueCode[];

export const PAGE_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => !('scope' in SEO_ISSUE_CATALOGUE[code]),
) as TPageIssueCode[];

/**
 * The codes a crawl runs and a screen lists — the catalogue minus what `enabled: false`
 * has retired.
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
export const ACTIVE_ISSUE_CODES = SEO_ISSUE_CODES.filter(
  (code) => !('enabled' in SEO_ISSUE_CATALOGUE[code]),
);
