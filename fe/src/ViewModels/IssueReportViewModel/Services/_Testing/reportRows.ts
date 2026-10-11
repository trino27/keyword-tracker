import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";

/** Report rows for the services' tests. */
export const page = (id: number, title = `Post ${id}`) => ({
	id,
	url: `https://yoast.com/post-${id}/`,
	title,
});

export const onPage = (
	code: "H1_MISSING" | "TITLE_MISSING" | "LANG_MISSING" | "IMAGES_MISSING_ALT",
	pageId: number,
	severity: "error" | "warning" | "notice" = "error",
): TReportIssue => ({
	code,
	severity,
	details: {},
	location: { kind: "page", page: page(pageId) },
});

export const speedOnPage = (pageId: number): TReportIssue => ({
	code: "CWV_LCP_POOR",
	severity: "warning",
	details: { value: 5200, max: 4000, source: "url" },
	location: { kind: "page", page: page(pageId) },
});

export const wholeSite = (pageCount: number): TReportIssue => ({
	code: "CWV_INP_NEEDS_IMPROVEMENT",
	severity: "notice",
	details: { value: 210, max: 200, source: "origin" },
	location: { kind: "allPages", pageCount },
});

export const siteCheck = (): TReportIssue => ({
	code: "SOFT_404",
	severity: "warning",
	details: {},
	location: { kind: "site" },
});
