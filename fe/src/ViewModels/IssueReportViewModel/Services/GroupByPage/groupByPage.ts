import type { IPageLocation, TSeoIssueSeverity } from "@app/contracts";
import { catalogueOrderOf } from "@Core/Helpers/IssueCopy/issueCopy";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";

export interface IPageGroupView {
	page: IPageLocation["page"];
	counts: Record<TSeoIssueSeverity, number>;
	rows: TReportIssue[];
}

export interface IByPageView {
	/** Site checks and whole-site speed rows: true of every page, shown first. */
	wholeSite: TReportIssue[];
	pages: IPageGroupView[];
}

const bySeverityThenCatalogue = (a: TReportIssue, b: TReportIssue) =>
	rank(a.severity) - rank(b.severity) || catalogueOrderOf(a.code) - catalogueOrderOf(b.code);

const rank = (severity: TSeoIssueSeverity) =>
	severity === "error" ? 0 : severity === "warning" ? 1 : 2;

/**
 * "By page": the whole-site rows first, then each page — the one with the most Critical
 * problems first, then Important, then Improvements, then by address — for a reader who
 * fixes a page at a time.
 */
export function groupByPage(issues: readonly TReportIssue[]): IByPageView {
	const wholeSite: TReportIssue[] = [];
	const pages = new Map<number, IPageGroupView>();
	for (const row of issues) {
		if (row.location.kind !== "page") {
			wholeSite.push(row);
			continue;
		}
		const { page } = row.location;
		const group = pages.get(page.id) ?? {
			page,
			counts: { error: 0, warning: 0, notice: 0 },
			rows: [],
		};
		group.rows.push(row);
		group.counts[row.severity] += 1;
		pages.set(page.id, group);
	}
	return {
		wholeSite: wholeSite.sort(bySeverityThenCatalogue),
		pages: [...pages.values()]
			.map((group) => ({ ...group, rows: group.rows.sort(bySeverityThenCatalogue) }))
			.sort(
				(a, b) =>
					b.counts.error - a.counts.error ||
					b.counts.warning - a.counts.warning ||
					b.counts.notice - a.counts.notice ||
					a.page.url.localeCompare(b.page.url),
			),
	};
}
