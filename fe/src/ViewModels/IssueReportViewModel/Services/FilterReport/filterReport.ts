import type { TSeoIssueSeverity } from "@app/contracts";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { issueTypeOf } from "../IssueTypeOf/issueTypeOf";

export const ISSUE_TYPES = ["all", "seo", "speed", "site"] as const;
export type TIssueTypeFilter = (typeof ISSUE_TYPES)[number];

export interface IReportFilters {
	levels: readonly TSeoIssueSeverity[];
	type: TIssueTypeFilter;
	/** Only this page's rows — and every whole-site row, which is also this page's. */
	pageId?: number;
	/** A substring of the page's URL or title. */
	query?: string;
}

/**
 * The rows the reader asked for. A page filter or a search never hides a site check or
 * a whole-site speed row: those are true of every page, this one included (plan I26).
 */
export function filterReport(
	issues: readonly TReportIssue[],
	filters: IReportFilters,
): TReportIssue[] {
	const query = filters.query?.trim().toLowerCase();
	return issues.filter((issue) => {
		if (!filters.levels.includes(issue.severity)) return false;
		if (filters.type !== "all" && issueTypeOf(issue.code) !== filters.type) return false;
		if (issue.location.kind !== "page") return true;
		const { page } = issue.location;
		if (filters.pageId !== undefined && page.id !== filters.pageId) return false;
		if (
			query &&
			!page.url.toLowerCase().includes(query) &&
			!(page.title ?? "").toLowerCase().includes(query)
		)
			return false;
		return true;
	});
}
