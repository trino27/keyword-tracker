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
 * sentence does not compile.
 */
const DESCRIBE: Record<TSeoIssueCode, (details: TDetails) => string> = {
	TITLE_MISSING: () => "The page has no <title> in its <head>.",
	TITLE_LENGTH: (d) =>
		`The title is ${num(d, "length")} characters; aim for ${num(d, "min")}–${num(d, "max")}.`,
	META_DESCRIPTION_MISSING: () => "The page has no meta description.",
	META_DESCRIPTION_LENGTH: (d) =>
		`The description is ${num(d, "length")} characters; aim for ${num(d, "min")}–${num(d, "max")}.`,
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
		`The content has ${num(d, "words")} words; aim for at least ${num(d, "min")}.`,
	LANG_MISSING: () => "The <html> element declares no language.",
	OG_TAGS_MISSING: (d) => `Missing: ${list(d, "missing")}.`,
	NOT_HTTPS: (d) => `The page is served from ${text(d, "url")}.`,
	REDIRECTED: (d) => `The sitemap lists ${text(d, "from")}, which redirects to ${text(d, "to")}.`,
	SLOW_RESPONSE: (d) =>
		`The first byte took ${num(d, "ttfbMs")} ms; aim for under ${num(d, "max")} ms.`,
	LARGE_PAGE: (d) => {
		const kb = (value: unknown) => (typeof value === "number" ? Math.round(value / 1024) : "?");
		return `The HTML is ${kb(d.bytes)} KB; aim for under ${kb(d.max)} KB.`;
	},
	KEYWORD_NOT_IN_TITLE: (d) => `The top keyword "${text(d, "keyword")}" is not in the title.`,
};

/** Issues by severity — errors first — each with its label, its sentence and the fix. */
export function groupIssues(issues: TSeoIssue[]): IIssueGroup[] {
	return SEO_ISSUE_SEVERITIES.map((severity) => ({
		severity,
		issues: issues
			.filter((issue) => issue.severity === severity)
			.map((issue) => ({
				code: issue.code,
				label: SEO_ISSUE_CATALOGUE[issue.code].label,
				detail: DESCRIBE[issue.code](issue.details),
				hint: SEO_ISSUE_CATALOGUE[issue.code].hint,
			})),
	})).filter((group) => group.issues.length > 0);
}
