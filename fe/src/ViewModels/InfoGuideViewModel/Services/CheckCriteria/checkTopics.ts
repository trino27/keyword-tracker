import type { TSeoIssueCode, TSiteCheckCode } from "@app/contracts";

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

/** A snippet of what the check wants to see, as it appears in the page, a header or a file. */
export interface ICheckExample {
	/** What the markup, header or file looks like when the check passes. */
	good: string;
	/** What it looks like when the check fails, where showing it teaches something. */
	bad?: string;
	/** How the snippet reads: page markup, an HTTP exchange, robots.txt, JSON-LD, a sitemap, or prose. */
	lang: "html" | "http" | "robots" | "json" | "xml" | "text";
}

/** Everything the guide says about one check beyond what the catalogue already holds. */
export interface ICheckCriteria {
	topic: TCheckTopicId;
	/** What a page (or site) has to be like for the check to pass. */
	passes: string;
	/** Exactly what makes the check fail. */
	fails: string;
	/**
	 * What a page gains when the check passes — the consequence in search, for readers or for
	 * the site. What failing costs is the catalogue's `plain.why`, so it is not repeated here.
	 */
	ifPasses: string;
	example: ICheckExample;
	/** What the tracker's code actually does to reach its verdict — read from the check, not guessed. */
	howChecked: string;
	/** How a person confirms the verdict on the live site, step by step, with tools anyone can use. */
	manualCheck: readonly string[];
}

export const seconds = (ms: number) => `${ms / 1000} s`;
export const thousands = (value: number) => value.toLocaleString("en-US");
