import {
	SEO_ISSUE_CATALOGUE,
	SEO_ISSUE_SEVERITIES,
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
	/**
	 * How many of the client's current pages carry this code, this one included. 1 means
	 * it is this page's problem; more means the fix probably belongs in a template.
	 */
	pagesAffected: number;
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

/**
 * One sentence per code. Typed by every catalogued code, so a new rule without its
 * sentence does not compile, and a retired one leaves an excess-property error behind.
 *
 * A measured code reads `value`, `min` and `max` from the finding itself — the bounds the
 * crawl judged the page against, not today's catalogue — so an old verdict and the sentence
 * explaining it never disagree.
 */
const DESCRIBE: Record<TSeoIssueCode, (details: TDetails) => string> = {
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
	CANONICAL_MISSING: () => "The page names no canonical URL.",
	CANONICAL_MISMATCH: (d) => `The canonical URL is ${text(d, "canonical")}.`,
	NOINDEX: (d) =>
		`${text(d, "source") === "header" ? "The X-Robots-Tag header" : "The robots meta tag"} says "${text(d, "value")}".`,
	IMAGES_MISSING_ALT: (d) =>
		`${num(d, "count")} of ${num(d, "total")} images in the content have no alt text.`,
	THIN_CONTENT: (d) =>
		`The content has ${num(d, "value")} words; aim for at least ${num(d, "min")}.`,
	LANG_MISSING: () => "The <html> element declares no language.",
	OG_TAGS_MISSING: (d) => `Missing: ${list(d, "missing")}.`,
	NOT_HTTPS: (d) => `The page is served from ${text(d, "url")}.`,
	REDIRECTED: (d) => `The sitemap lists ${text(d, "from")}, which redirects to ${text(d, "to")}.`,
	LARGE_PAGE: (d) => {
		const kb = (value: unknown) => (typeof value === "number" ? Math.round(value / 1024) : "?");
		return `The HTML is ${kb(d.value)} KB; aim for under ${kb(d.max)} KB.`;
	},
	STRUCTURED_DATA_MISSING: (d) => {
		const types = list(d, "types");
		return types
			? `The page declares ${types}, but no Article or BlogPosting.`
			: "The page declares no structured data.";
	},
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
				pagesAffected: issue.pagesAffected ?? 1,
			})),
	})).filter((group) => group.issues.length > 0);
}
