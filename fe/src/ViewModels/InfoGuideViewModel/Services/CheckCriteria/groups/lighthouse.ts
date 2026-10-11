import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import type { TGuideCode, TScoredLighthouseCode } from "@Core/Constants/checkTopics";
import type { ICheckCriteria } from "../criteriaShape";

/** What is particular to one Lighthouse audit; how it is checked is the same for all. */
interface ILighthouseSpec {
	passes: string;
	fails: string;
	ifPasses: string;
	good: string;
	bad: string;
}

const CATEGORY_NAME = { seo: "SEO", accessibility: "Accessibility" } as const;

/**
 * Lighthouse is not re-implemented here: the tracker reads Lighthouse's own verdict from
 * Google's answer. So how a Lighthouse code is checked — by the tracker and by hand — is
 * one procedure, filled in with the audit's id and the categories that score it.
 */
function lighthouseCriteria(code: TScoredLighthouseCode, spec: ILighthouseSpec): ICheckCriteria {
	const { audit, weights } = SEO_ISSUE_CATALOGUE[code];
	const categories = (Object.keys(weights) as (keyof typeof CATEGORY_NAME)[]).map(
		(category) => CATEGORY_NAME[category],
	);
	const inCategories = categories.join(" and ");
	return {
		passes: spec.passes,
		fails: spec.fails,
		ifPasses: spec.ifPasses,
		example: { good: spec.good, bad: spec.bad, lang: "html" },
		howChecked: `After each crawl (at most once every 24 hours) Google PageSpeed Insights loads the page as a phone and runs Lighthouse on it; the tracker reads the result of Lighthouse's own "${audit}" audit from that answer and does not judge it again. A failed audit becomes this issue and a passed one counts as passed; an audit Lighthouse reports as not applicable is left out, and one that errored is not recorded at all. Lighthouse scores it in its ${inCategories} category; in this tracker's score it counts at its own level.`,
		manualCheck: [
			"Open PageSpeed Insights (https://pagespeed.web.dev), enter the page URL and choose Mobile.",
			`In the ${inCategories} section, find the audit — failed ones are listed first, passed ones under “Passed audits”. Expand it to see the elements that fail.`,
			`Or in Chrome DevTools → Lighthouse, tick ${inCategories}, choose Mobile and run it on your own machine (audit id: ${audit}).`,
		],
	};
}

const SPECS: Record<TScoredLighthouseCode, ILighthouseSpec> = {
	// ── SEO audits ───────────────────────────────────────────────────────────────────
	LH_IS_CRAWLABLE: {
		passes: "No rule keeps every search engine from indexing the page.",
		fails: "A noindex or none in a robots meta tag or X-Robots-Tag, a past unavailable_after date, or a robots.txt Disallow for the URL. A rule aimed at one crawler only is a warning, not a failure.",
		ifPasses:
			"Search engines may crawl and index the page, so it can appear in results at all.",
		good: '<meta name="robots" content="max-image-preview:large">',
		bad: '<meta name="robots" content="noindex">',
	},
	LH_DOCUMENT_TITLE: {
		passes: "The page has a <title> with text.",
		fails: "There is no <title>, or it is empty.",
		ifPasses:
			"Search results, browser tabs, bookmarks and screen readers all get a name for the page.",
		good: "<title>Local SEO checklist for small businesses</title>",
		bad: "<title></title>",
	},
	LH_META_DESCRIPTION: {
		passes: 'The page has a <meta name="description"> with text.',
		fails: "There is no meta description, or it is empty.",
		ifPasses: "Google has your own summary to use as the snippet when it fits the search.",
		good: '<meta name="description" content="Twelve steps to rank in the local map pack.">',
		bad: '<meta name="description" content="">',
	},
	LH_HTTP_STATUS_CODE: {
		passes: "The page answers with a successful status.",
		fails: "The page answers 400 or above — a client or server error.",
		ifPasses:
			"Google can index the page; an error status tells it the page does not exist or is broken.",
		good: "HTTP/1.1 200 OK",
		bad: "HTTP/1.1 404 Not Found",
	},
	LH_LINK_TEXT: {
		passes: "No link uses generic text such as “click here”, “read more” or “here”.",
		fails: "One or more links say only something generic.",
		ifPasses:
			"Google and readers learn from each link's words what the page behind it is about.",
		good: 'Read the <a href="/local-seo-checklist/">local SEO checklist</a>.',
		bad: 'For the checklist, <a href="/local-seo-checklist/">click here</a>.',
	},
	LH_CRAWLABLE_ANCHORS: {
		passes: "Every link has an href that resolves to a real web address. Links with a role, email links and in-page targets are left alone.",
		fails: "A link has an empty href, javascript:void(0), a file: address, an address that cannot be read as a URL, or no href at all and works only through a click script.",
		ifPasses: "Google can follow every link to discover the pages behind it.",
		good: '<a href="/pricing/">Pricing</a>',
		bad: '<a onclick="goTo(\'pricing\')">Pricing</a>\n<a href="javascript:void(0)">Pricing</a>',
	},
	LH_ROBOTS_TXT: {
		passes: "robots.txt can be fetched and every line is valid.",
		fails: "robots.txt answers a server error or 429, cannot be fetched, or has a line that breaks the format — an unknown directive, a rule before any user-agent, a pattern not starting with / or *, a sitemap line without a full URL. A missing file (404) is not a failure.",
		ifPasses: "Crawlers read the rules the way you wrote them.",
		good: "User-agent: *\nDisallow: /cart/\nSitemap: https://example.com/sitemap.xml",
		bad: "User-agent *\nDisalow: /cart/\nSitemap: /sitemap.xml",
	},
	LH_IMAGE_ALT: {
		passes: 'Every <img> has an alt attribute (alt="" for decorative ones).',
		fails: "An image has no alt attribute.",
		ifPasses:
			"Screen readers describe each image, and Google gets text to understand it for image search.",
		good: '<img src="/img/map-pack.png" alt="Map pack with three local results">',
		bad: '<img src="/img/map-pack.png">',
	},
	LH_HREFLANG: {
		passes: "Every hreflang uses a valid ISO 639-1 language code (or x-default) and a full URL.",
		fails: "An hreflang uses an invalid language code, or a relative address. Region codes and links back are not checked.",
		ifPasses: "Google can show each reader the language version meant for them.",
		good: '<link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/">',
		bad: '<link rel="alternate" hreflang="english" href="/en-gb/">',
	},
	LH_CANONICAL: {
		passes: "The canonical is a single, valid, absolute URL that does not send an inner page to the home page or to another language version.",
		fails: "The canonical is invalid or relative, the page names more than one, an inner page points to the home page, or it points to one of the page's other language versions. A page with no canonical is not judged.",
		ifPasses: "Google gets one clear signal about which URL to show for this content.",
		good: '<link rel="canonical" href="https://example.com/blog/local-seo/">',
		bad: '<link rel="canonical" href="/blog/local-seo/">\n<link rel="canonical" href="https://example.com/">  <!-- on an inner page -->',
	},
};

/** The audits Lighthouse scores in its SEO category — the ones the tracker scores. */
export const LIGHTHOUSE_CRITERIA = Object.fromEntries(
	(Object.keys(SPECS) as TScoredLighthouseCode[]).map((code) => [
		code,
		lighthouseCriteria(code, SPECS[code]),
	]),
) as Record<TScoredLighthouseCode, ICheckCriteria>;

/**
 * How a Lighthouse audit differs from the tracker's own check of the same thing — or of a
 * neighbouring thing easy to mistake for the same. Shown on both cards. Each claim rests on
 * the Lighthouse catalogue entry's explanation and on our check's implementation.
 */
export const LIGHTHOUSE_COMPARISONS: Partial<
	Record<TScoredLighthouseCode, { ours: readonly TGuideCode[]; text: string }>
> = {
	LH_IS_CRAWLABLE: {
		ours: ["NOINDEX", "ROBOTS_BLOCKS_GOOGLEBOT"],
		text: "Same question, read twice. Lighthouse fails only when every search engine is kept out — a rule aimed at googlebot alone is a warning there. Ours count a googlebot-only noindex as Critical too, since Google is the engine that matters here, and read the robots.txt group addressed to Googlebot specifically. Lighthouse judges the rendered page, so a noindex added by JavaScript counts; ours read the HTML and headers as served.",
	},
	LH_HTTP_STATUS_CODE: {
		ours: ["SITEMAP_LISTS_NON_INDEXABLE"],
		text: "No page check matches it: a post that answers an error is never analysed by the crawl — it is skipped and named in the run log, and sitemap entries answering errors are reported by the site check. Lighthouse reports the status Google's tester received, which can differ from ours, e.g. when a bot wall answers 403 to one and 200 to the other.",
	},
	LH_ROBOTS_TXT: {
		ours: [
			"ROBOTS_TXT_TRUNCATED",
			"ROBOTS_TXT_UNSUPPORTED_RULES",
			"ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES",
		],
		text: "Different questions about the same file. Lighthouse validates its syntax line by line and fails a server error. Our site checks ask whether Google ignores part of it (past 500 KiB), whether it relies on rules Google never supported (noindex:, host:), and whether a Googlebot group silently drops the general rules. A robots.txt answering a server error stops our crawl altogether.",
	},
	LH_CANONICAL: {
		ours: [
			"CANONICAL_MISSING",
			"CANONICAL_MISMATCH",
			"CANONICAL_TO_HTTP",
			"CANONICAL_CONFLICT",
			"CANONICAL_RELATIVE",
			"CANONICAL_TARGET_BROKEN",
		],
		text: "Lighthouse puts everything in one audit and does not judge a page with no canonical; ours split it into six. A missing canonical is Important for us. A relative one fails Lighthouse but is only an Improvement for us, since Google accepts it. Any canonical to another URL is noted by us, while Lighthouse objects only to the home page or another language version. Ours also flag an http:// canonical and fetch the target to see whether it is broken.",
	},
	LH_HREFLANG: {
		ours: ["HREFLANG_INVALID", "HREFLANG_NO_SELF_REFERENCE", "HREFLANG_NOT_RECIPROCAL"],
		text: "Lighthouse checks the language part of each code and that each href is a full URL. Ours also check the region (en-UK fails), name the code that was meant (ua → uk), fail a page whose canonical points elsewhere, and add two checks Lighthouse lacks: the set must include the page itself, and each version must link back.",
	},
	LH_DOCUMENT_TITLE: {
		ours: ["TITLE_MISSING"],
		text: "The same rule: a title that exists and is not empty. Lighthouse reads the rendered page, so a title set by JavaScript passes there and can fail ours, which reads the HTML as served — what crawlers without JavaScript see. Title length, script, outdated year and duplicates across pages are judged only by our checks.",
	},
	LH_META_DESCRIPTION: {
		ours: ["META_DESCRIPTION_MISSING"],
		text: "The same rule: present and not empty — an Improvement in Lighthouse, Important in ours. Length, repeating the title and duplicates across pages are judged only by our checks.",
	},
	LH_IMAGE_ALT: {
		ours: ["IMAGES_MISSING_ALT"],
		text: "Lighthouse checks every image on the rendered page — logo, theme, lazy-loaded images — and accepts other ways of naming an image or marking it decorative. Ours check only the article's own images in the HTML as served, and look for the alt attribute itself.",
	},
	LH_LINK_TEXT: {
		ours: ["LINKS_WITHOUT_TEXT"],
		text: "Different problems: Lighthouse flags links whose text is generic (“click here”, “learn more”); ours flag links with no text at all. No crawl check judges generic wording.",
	},
	LH_CRAWLABLE_ANCHORS: {
		ours: ["UNCRAWLABLE_LINKS"],
		text: "They disagree on purpose about one case. Lighthouse flags javascript:void(0) and empty-href controls; ours leave them alone, because there is no page behind them to miss. Ours flag single-page-app routes in the fragment (#/pricing), which Lighthouse treats as in-page targets. Lighthouse checks every link on the rendered page; ours the article text.",
	},
};
