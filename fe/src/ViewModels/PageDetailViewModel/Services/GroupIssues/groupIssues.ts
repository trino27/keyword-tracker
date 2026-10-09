import {
	SEO_ISSUE_CATALOGUE,
	SEO_ISSUE_SEVERITIES,
	type ISeoIssueSource,
	type TSeoIssueCode,
	type TSeoIssueSeverity,
} from "@app/contracts";
import type { TSeoIssue } from "@Gateways/PageGateway/Validation/PageSchemas";

export interface IIssueView {
	code: TSeoIssueCode;
	label: string;
	/** What exactly is wrong on this page, from the issue's details. */
	detail: string;
	hint: string;
	/** Why the check exists, at length, and what Google does and does not do with it. */
	explanation: string;
	/** Where the explanation comes from, to open beside the finding. */
	sources: readonly ISeoIssueSource[];
	/**
	 * What the crawl found on this page that proves the finding — the markup, header or
	 * robots.txt rule as written. Empty for a finding stored before findings carried it.
	 */
	evidence: string[];
	/**
	 * How many of the client's current pages carry this code, this one included. 1 means
	 * it is this page's problem; more means the fix probably belongs in a template.
	 */
	pagesAffected: number;
	/**
	 * The other pages this finding is ABOUT — the ones sharing the keyword, the title
	 * or the description. Empty for every finding a page makes on its own.
	 *
	 * They are URLs rather than links into the tracker because the analysis names them
	 * before anything is stored: at the moment a run is judged the pages have no ids
	 * yet, so the URL is the only handle that exists.
	 */
	relatedUrls: string[];
}

export interface IIssueGroup {
	severity: TSeoIssueSeverity;
	issues: IIssueView[];
}

type TDetails = Record<string, unknown>;

const num = (details: TDetails, key: string) =>
	typeof details[key] === "number" ? details[key] : "?";
const text = (details: TDetails, key: string) =>
	typeof details[key] === "string" ? details[key] : "";
const list = (details: TDetails, key: string) =>
	Array.isArray(details[key]) ? (details[key] as unknown[]).map(String).join(", ") : "";
/** A list of strings from the details; named for its first use, now read for any list. */
const urls = (details: TDetails, key: string): string[] =>
	Array.isArray(details[key])
		? (details[key] as unknown[]).filter((url): url is string => typeof url === "string")
		: [];
/** "Another page" / "3 other pages", with the verb the count needs. */
const others = (details: TDetails, verb: string) => {
	const count = urls(details, "otherUrls").length;
	return count === 1 ? `Another page ${verb}s` : `${count} other pages ${verb}`;
};

/**
 * One sentence per code. Typed by every catalogued code, so a new rule without its
 * sentence does not compile, and a retired one leaves an excess-property error behind.
 *
 * A measured code reads `value`, `min` and `max` from the finding itself — the bounds the
 * crawl judged the page against, not today's catalogue — so an old verdict and the sentence
 * explaining it never disagree.
 */
const DESCRIBE: Record<TSeoIssueCode, (details: TDetails) => string> = {
	// These three name the pages themselves, which are rendered as links from
	// `relatedUrls`; the sentence says how many and leaves the list to them.
	KEYWORD_CANNIBALISATION: (d) => `${others(d, "lead")} with "${text(d, "term")}".`,
	TITLE_DUPLICATE: (d) => `${others(d, "use")} the same title.`,
	META_DESCRIPTION_DUPLICATE: (d) => `${others(d, "use")} the same description.`,
	NEAR_DUPLICATE_CONTENT: (d) => {
		const share = typeof d.similarity === "number" ? Math.round(d.similarity * 100) : "?";
		return `${others(d, "share")} most of this text (${share}% of its five-word sequences).`;
	},
	TITLE_MISSING: () => "The page has no <title> in its <head>.",
	TITLE_LENGTH: (d) =>
		`The title is ${num(d, "value")} characters; aim for ${num(d, "min")}–${num(d, "max")}.`,
	META_DESCRIPTION_MISSING: () => "The page has no meta description.",
	META_DESCRIPTION_LENGTH: (d) =>
		`The description is ${num(d, "value")} characters; aim for ${num(d, "min")}–${num(d, "max")}.`,
	H1_MISSING: () => "The page has no H1 heading.",
	H1_MULTIPLE: (d) => `The page has ${num(d, "count")} H1 headings.`,
	HEADING_SKIP: (d) =>
		`"${text(d, "heading")}" jumps from ${text(d, "from").toUpperCase()} to ${text(d, "to").toUpperCase()}.`,
	CANONICAL_MISSING: (d) =>
		urls(d, "outsideHead").length > 0
			? "The canonical link is written in <body>, where Google ignores it."
			: "The page names no canonical URL.",
	CANONICAL_MISMATCH: (d) =>
		`The ${text(d, "source") === "header" ? "Link header" : "canonical link"} names ${text(d, "canonical")}, not this page.`,
	CANONICAL_CONFLICT: (d) =>
		`The page declares ${urls(d, "canonicals").length} different canonical URLs.`,
	NOINDEX: (d) =>
		text(d, "unavailableAfter")
			? `The page asked to leave search results after ${text(d, "unavailableAfter").slice(0, 10)}, which has passed.`
			: `${text(d, "source") === "header" ? "The X-Robots-Tag header" : `The ${text(d, "name") || "robots"} meta tag`} says "${text(d, "value")}".`,
	CANONICAL_RELATIVE: (d) => `The canonical is written as a path: ${list(d, "hrefs")}.`,
	DEVELOPMENT_HOST_REFERENCES: (d) => {
		const count = num(d, "count");
		return `${count} reference${count === 1 ? "" : "s"} on the page point${count === 1 ? "s" : ""} at a development or staging host.`;
	},
	SNIPPET_RESTRICTED: (d) =>
		`${text(d, "source") === "header" ? "The X-Robots-Tag header" : `The ${text(d, "name") || "robots"} meta tag`} says "${text(d, "rule")}".`,
	ROBOTS_BLOCKS_AI_SEARCH: (d) => `robots.txt keeps ${list(d, "crawlers")} from this page.`,
	ROBOTS_BLOCKS_GOOGLEBOT: (d) =>
		`Googlebot may not fetch this page: ${text(d, "rule") ? `robots.txt ${text(d, "rule")}` : "robots.txt disallows it"}.`,
	ROBOTS_BLOCKS_RESOURCES: (d) =>
		`${num(d, "count")} of ${num(d, "total")} scripts and stylesheets on this site's host are closed to Googlebot.`,
	IMAGES_MISSING_ALT: (d) =>
		`${num(d, "count")} of ${num(d, "total")} images in the content have no alt text.`,
	THIN_CONTENT: (d) =>
		`The content has ${num(d, "value")} words; aim for at least ${num(d, "min")}.`,
	AUTHOR_MISSING: () => "Nothing on the page names who wrote it.",
	DATE_BUMPED_WITHOUT_CHANGES: (d) =>
		`The modified date moved from ${text(d, "before")} to ${text(d, "after")}; the text did not change.`,
	NO_INTERNAL_LINKS: (d) => {
		const external = num(d, "external");
		return external === 0
			? "The content contains no links at all."
			: `The content links out ${external} time${external === 1 ? "" : "s"}, never to this site.`;
	},
	INTERNAL_LINKS_NOFOLLOW: (d) =>
		`${num(d, "count")} of ${num(d, "total")} links to this site ${d.count === 1 ? "is" : "are"} marked nofollow.`,
	INTERNAL_LINK_VARIANTS: (d) =>
		`${num(d, "count")} of ${num(d, "total")} links to this site ${d.count === 1 ? "uses" : "use"} a URL the site does not serve.`,
	LINKS_WITHOUT_TEXT: (d) => {
		const count = num(d, "count");
		return `${count} link${count === 1 ? "" : "s"} to this site ${count === 1 ? "has" : "have"} no text, alt or label.`;
	},
	UNCRAWLABLE_LINKS: (d) => {
		const count = num(d, "count");
		return `${count} link${count === 1 ? "" : "s"} in the content ${count === 1 ? "has" : "have"} no URL a crawler can follow.`;
	},
	LANG_MISSING: () => "The <html> element declares no language.",
	HREFLANG_INVALID: (d) => {
		const invalid = list(d, "invalid");
		const parts = [
			invalid && `not a language code: ${invalid}`,
			d.selfReferenced === false && "the alternates never name this page",
			text(d, "canonicalElsewhere") &&
				`the canonical names another page (${text(d, "canonicalElsewhere")})`,
		].filter((part): part is string => typeof part === "string" && part !== "");
		return `The hreflang set is ignored — ${parts.join("; ")}.`;
	},
	VIEWPORT_MISSING: () => "The page has no viewport meta tag.",
	OG_TAGS_MISSING: (d) => `Missing: ${list(d, "missing")}.`,
	NOT_HTTPS: (d) => `The page is served from ${text(d, "url")}.`,
	CHARSET_MISSING_OR_LATE: (d) =>
		typeof d.declarationEnd === "number"
			? `The encoding is declared at byte ${d.declarationEnd}, past the first 1024.`
			: "Neither the header nor the HTML declares the encoding.",
	MIXED_CONTENT: (d) =>
		`${num(d, "count")} resources load over plain HTTP, including ${list(d, "examples")}.`,
	META_REFRESH: (d) =>
		`The page carries <meta http-equiv="refresh" content="${text(d, "content")}">.`,
	REDIRECTED: (d) =>
		`The sitemap lists ${text(d, "from")}, which ${d.temporary === true ? "temporarily " : ""}redirects to ${text(d, "to")}.`,
	LARGE_PAGE: (d) => {
		const kb = (value: unknown) => (typeof value === "number" ? Math.round(value / 1024) : "?");
		return `The HTML is ${kb(d.value)} KB; aim for under ${kb(d.max)} KB.`;
	},
	HTML_NOT_COMPRESSED: (d) =>
		text(d, "encoding")
			? `The server answered with Content-Encoding: ${text(d, "encoding")}.`
			: "The server sent the HTML uncompressed.",
	STRUCTURED_DATA_MISSING: (d) => {
		const types = list(d, "types");
		return types
			? `The page declares ${types}, but no Article or BlogPosting.`
			: "The page declares no structured data.";
	},
	STRUCTURED_DATA_INVALID: (d) => {
		const count = num(d, "count");
		return `${count} JSON-LD block${count === 1 ? " is" : "s are"} not valid JSON.`;
	},
	DATES_INCONSISTENT: () => "The page's dates contradict each other.",
	STRUCTURED_DATA_INCOMPLETE: (d) => `The article markup omits ${list(d, "missing")}.`,
};

/** Issues by severity — errors first — each with its label, its sentence and the fix. */
export function groupIssues(issues: (TSeoIssue & { pagesAffected?: number })[]): IIssueGroup[] {
	return SEO_ISSUE_SEVERITIES.map((severity) => ({
		severity,
		issues: issues
			.filter((issue) => issue.severity === severity)
			.map((issue) => ({
				code: issue.code,
				label: SEO_ISSUE_CATALOGUE[issue.code].label,
				detail: DESCRIBE[issue.code](issue.details),
				hint: SEO_ISSUE_CATALOGUE[issue.code].hint,
				explanation: SEO_ISSUE_CATALOGUE[issue.code].explanation,
				sources: SEO_ISSUE_CATALOGUE[issue.code].sources,
				evidence: urls(issue.details, "evidence"),
				pagesAffected: issue.pagesAffected ?? 1,
				relatedUrls: urls(issue.details, "otherUrls"),
			})),
	})).filter((group) => group.issues.length > 0);
}
