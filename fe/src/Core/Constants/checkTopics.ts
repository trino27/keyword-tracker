import {
	LIGHTHOUSE_ISSUE_CODES,
	SEO_ISSUE_CATALOGUE,
	type TLighthouseIssueCode,
	type TSeoIssueCode,
	type TSiteCheckCode,
} from "@app/contracts";

/** Every code the guide explains: a page check, a speed finding or a site check. */
export type TGuideCode = TSeoIssueCode | TSiteCheckCode;

/**
 * The guide's chapters of checks, in reading order: what a searcher sees first (the title
 * and snippet), then what decides whether the page is in search at all, then the page's
 * body, its build, its speed, and finally the site around it.
 */
export const CHECK_TOPICS = [
	{
		id: "titles",
		title: "Titles",
		intro: "The <title> is the headline of the search result — the first thing a searcher reads and the main reason they click or scroll past. Google reads it to understand the page and usually shows it, but rewrites it when it is missing, vague, too long or in the wrong language.",
	},
	{
		id: "descriptions",
		title: "Meta descriptions",
		intro: "The meta description is not a ranking factor. It is the text Google may show under the headline when it describes the page better than any passage of the page itself — the pitch that earns the click. A missing, repeated or empty one leaves Google to pick an excerpt.",
	},
	{
		id: "headings",
		title: "Headings",
		intro: "Headings are the page's outline. Readers skim by them, screen-reader users jump between them, and Google reads them to understand what each part of the page is about. Google says heading order does not affect ranking, so most of these are about readability and accessibility.",
	},
	{
		id: "content",
		title: "Content quality",
		intro: "Google's ranking systems reward helpful, reliable content written for people. These checks look for the visible symptoms of content that is not: stubs, copies, posts competing with each other, no author, no sources, and dates changed without changes.",
	},
	{
		id: "canonical",
		title: "Canonical URLs",
		intro: 'The same post is often reachable at several addresses. Google groups the copies and shows one — the canonical. rel="canonical" is your strongest hint about which one; a missing, wrong or self-contradicting canonical leaves the choice to Google and can split the credit links earn.',
	},
	{
		id: "indexing",
		title: "Indexing and robots rules",
		intro: "Before a page can rank, Google must be allowed to crawl it (robots.txt) and to index it (no noindex). These are the checks whose failure takes a page out of search entirely, plus the rules that limit how it may be shown — snippets, image previews, AI search crawlers.",
	},
	{
		id: "links",
		title: "Links",
		intro: "Links are how search engines discover pages and how they learn what a page is about: the anchor text of a link describes the page it points to. A post that links nowhere, or links in ways a crawler cannot follow, passes none of that on.",
	},
	{
		id: "media",
		title: "Images and video",
		intro: "Images and video can be found in image and video search, make a long text easier to read, and need text alternatives for people who cannot see them. Google needs a real src, alt text and, for video, metadata to understand them.",
	},
	{
		id: "international",
		title: "Language, mobile and encoding",
		intro: "Google indexes the page its smartphone crawler sees, decides the language from the text, and uses hreflang to show the right language version. These checks make sure the page is readable on a phone, in the right language, without garbled characters.",
	},
	{
		id: "sharing",
		title: "Social previews",
		intro: "Open Graph tags decide how a shared link looks on social networks and in messengers, and Google Discover uses the page's image the same way. They do not affect Google rankings; they decide whether a shared post looks worth opening.",
	},
	{
		id: "security",
		title: "HTTPS and redirects",
		intro: 'Every page should be served over HTTPS at its final address. Plain HTTP is labelled "Not secure", insecure resources get blocked, and every redirect is an extra round trip for readers and crawlers.',
	},
	{
		id: "performance",
		title: "Speed risks in the HTML",
		intro: "These checks read the page's HTML and headers for patterns known to slow pages down. They are risks, not measurements: whether a page is actually slow is what the Core Web Vitals findings below say. They count in the SEO score at the Improvement level.",
	},
	{
		id: "structuredData",
		title: "Structured data",
		intro: "Structured data (JSON-LD) states facts Google would otherwise guess — the headline, author, dates, image, breadcrumb trail — and makes the page eligible for richer results. It is optional, but markup that is broken or contradicts the page is worse than none.",
	},
	{
		id: "lighthouseSeo",
		title: "Lighthouse: SEO audits",
		intro: "Google's own Lighthouse runs inside the PageSpeed Insights measurement and scores ten SEO audits on the page as a phone renders it. The tracker records Lighthouse's verdicts as they are — it does not re-judge them — and they count in the score beside the crawl's checks. Several overlap a crawl check on purpose: two independent readings of the same page.",
	},
	{
		id: "accessibility",
		title: "Lighthouse: accessibility audits",
		intro: "The accessibility audits Lighthouse scores, run by Deque's axe engine: whether people using screen readers, keyboards, zoom or small screens can use the page. Accessibility is not a ranking factor by itself, but these are real barriers for real visitors, and several (titles, alt text, link names, language) are also how search engines understand the page. They count in the score.",
	},
	{
		id: "speed",
		title: "Core Web Vitals findings",
		intro: "Written from Google's PageSpeed Insights measurement, not from the HTML. A metric outside Google's good band produces exactly one finding: Improvement while it needs improvement, Important once it is poor. These findings are listed with the issues but never change the SEO score.",
	},
	{
		id: "siteRobots",
		title: "Site: robots.txt",
		intro: "Judged once per crawl for the whole site, not per page, and outside the page score. robots.txt is the first file every crawler reads; these checks find rules Google ignores or reads differently from what the site intended.",
	},
	{
		id: "siteSitemap",
		title: "Site: sitemap",
		intro: "The sitemap is the list of URLs a site wants indexed. Google trusts a sitemap that agrees with its pages and learns to ignore one that keeps contradicting them. Judged once per crawl, outside the page score.",
	},
	{
		id: "siteHost",
		title: "Site: host and server",
		intro: "How the server answers for the site as a whole: whether one address serves it, how the other addresses redirect, whether a missing page says so, and whether posts arrive as text or as an empty JavaScript shell. Judged once per crawl, outside the page score.",
	},
	{
		id: "siteIdentity",
		title: "Site: name and icon",
		intro: "Google shows a site name and an icon beside every result from the site. Both are read from the home page; when they are missing or inconsistent, Google substitutes its own guess or a generic icon. Judged once per crawl, outside the page score.",
	},
] as const satisfies readonly { id: string; title: string; intro: string }[];

export type TCheckTopicId = (typeof CHECK_TOPICS)[number]["id"];

/**
 * The chapter every code belongs to — the one grouping the Info guide and the page's checks
 * both use, so the two screens never file a check differently. Every code but Lighthouse's
 * is listed here, typed so that a code added to a catalogue without its chapter does not
 * compile; Lighthouse's follow from the audit itself: SEO when Lighthouse weighs it in its
 * SEO category, accessibility otherwise.
 */
const LISTED_TOPIC_OF = {
	THIN_CONTENT: "content",
	AUTHOR_MISSING: "content",
	DATE_BUMPED_WITHOUT_CHANGES: "content",
	NEAR_DUPLICATE_CONTENT: "content",
	KEYWORD_CANNIBALISATION: "content",
	NO_EXTERNAL_SOURCES: "content",
	CANONICAL_MISSING: "canonical",
	CANONICAL_MISMATCH: "canonical",
	CANONICAL_TO_HTTP: "canonical",
	CANONICAL_CONFLICT: "canonical",
	CANONICAL_TARGET_BROKEN: "canonical",
	DEVELOPMENT_HOST_REFERENCES: "canonical",
	CANONICAL_RELATIVE: "canonical",
	NOINDEX: "indexing",
	SNIPPET_RESTRICTED: "indexing",
	IMAGE_PREVIEW_NOT_LARGE: "indexing",
	ROBOTS_BLOCKS_GOOGLEBOT: "indexing",
	ROBOTS_BLOCKS_RESOURCES: "indexing",
	ROBOTS_BLOCKS_AI_SEARCH: "indexing",
	NO_INTERNAL_LINKS: "links",
	INTERNAL_LINKS_NOFOLLOW: "links",
	INTERNAL_LINK_VARIANTS: "links",
	BROKEN_LINKS: "links",
	LINKS_TO_REDIRECTS: "links",
	LINKS_WITHOUT_TEXT: "links",
	UNCRAWLABLE_LINKS: "links",
	IMAGES_MISSING_ALT: "media",
	NO_IMAGES: "media",
	IMAGES_NOT_INDEXABLE: "media",
	IMAGE_FILENAMES_GENERIC: "media",
	VIDEO_WITHOUT_METADATA: "media",
	LANG_MISSING: "international",
	HREFLANG_INVALID: "international",
	HREFLANG_NO_SELF_REFERENCE: "international",
	HREFLANG_NOT_RECIPROCAL: "international",
	VIEWPORT_MISSING: "international",
	CHARSET_MISSING_OR_LATE: "international",
	OG_TAGS_MISSING: "sharing",
	OG_URL_MISMATCH: "sharing",
	PREVIEW_IMAGE_TOO_SMALL: "sharing",
	PREVIEW_IMAGE_IS_LOGO: "sharing",
	NOT_HTTPS: "security",
	MIXED_CONTENT: "security",
	REDIRECTED: "security",
	META_REFRESH: "security",
	LARGE_PAGE: "performance",
	LCP_IMAGE_LAZY_LOADED: "performance",
	RENDER_BLOCKING_SCRIPTS: "performance",
	FONT_PRELOAD_WITHOUT_CROSSORIGIN: "performance",
	BFCACHE_BLOCKED_BY_NO_STORE: "performance",
	DOM_SIZE_LARGE: "performance",
	HTML_NOT_COMPRESSED: "performance",
	CWV_LCP_NEEDS_IMPROVEMENT: "speed",
	CWV_LCP_POOR: "speed",
	CWV_INP_NEEDS_IMPROVEMENT: "speed",
	CWV_INP_POOR: "speed",
	CWV_CLS_NEEDS_IMPROVEMENT: "speed",
	CWV_CLS_POOR: "speed",
	ROBOTS_TXT_TRUNCATED: "siteRobots",
	ROBOTS_TXT_UNSUPPORTED_RULES: "siteRobots",
	ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES: "siteRobots",
	SITEMAP_LISTS_NON_INDEXABLE: "siteSitemap",
	SITEMAP_LISTS_OTHER_HOST_VARIANTS: "siteSitemap",
	SITEMAP_LASTMOD_UNRELIABLE: "siteSitemap",
	HOST_VARIANT_SERVES_CONTENT: "siteHost",
	HOST_REDIRECT_CHAIN: "siteHost",
	SOFT_404: "siteHost",
	CONTENT_NEEDS_JAVASCRIPT: "siteHost",
	STRUCTURED_DATA_INVALID: "structuredData",
	DATES_INCONSISTENT: "structuredData",
	STRUCTURED_DATA_MISSING: "structuredData",
	STRUCTURED_DATA_INCOMPLETE: "structuredData",
	AUTHOR_MARKUP_INCOMPLETE: "structuredData",
	ARTICLE_DATE_FORMAT_INVALID: "structuredData",
	ARTICLE_HEADLINE_MISMATCH: "structuredData",
	BREADCRUMB_MISSING: "structuredData",
	BREADCRUMB_INVALID: "structuredData",
	FAVICON_INVALID: "siteIdentity",
	SITE_NAME_NOT_DECLARED: "siteIdentity",
	SITE_NAME_INCONSISTENT: "siteIdentity",
	TITLE_MISSING: "titles",
	TITLE_LENGTH: "titles",
	TITLE_SCRIPT_MISMATCH: "titles",
	TITLE_YEAR_OUTDATED: "titles",
	TITLE_DUPLICATE: "titles",
	META_DESCRIPTION_MISSING: "descriptions",
	META_DESCRIPTION_LENGTH: "descriptions",
	META_DESCRIPTION_REPEATS_TITLE: "descriptions",
	META_DESCRIPTION_DUPLICATE: "descriptions",
	H1_MISSING: "headings",
	H1_MULTIPLE: "headings",
	HEADING_SKIP: "headings",
	NO_SUBHEADINGS: "headings",
} as const satisfies Record<Exclude<TGuideCode, TLighthouseIssueCode>, TCheckTopicId>;

const LIGHTHOUSE_TOPIC_OF = Object.fromEntries(
	LIGHTHOUSE_ISSUE_CODES.map((code) => [
		code,
		"seo" in SEO_ISSUE_CATALOGUE[code].weights ? "lighthouseSeo" : "accessibility",
	]),
) as Record<TLighthouseIssueCode, TCheckTopicId>;

export const CHECK_TOPIC_OF: Record<TGuideCode, TCheckTopicId> = {
	...LISTED_TOPIC_OF,
	...LIGHTHOUSE_TOPIC_OF,
};
