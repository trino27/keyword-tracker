import { SEO_ISSUE_SEVERITIES, type TSeoIssueSeverity } from "@app/contracts";
import { catalogueOrderOf, type TReportCode } from "@Core/Helpers/IssueCopy/issueCopy";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";

/** One problem, once: every place it was found, and how many pages that comes to. */
export interface IIssueCardView {
	code: TReportCode;
	severity: TSeoIssueSeverity;
	/** Pages affected — a whole-site row counts its pages, a site check the whole crawl. */
	affectedPages: number;
	/** True when the problem belongs to the site, not to listed pages. */
	wholeSite: boolean;
	rows: TReportIssue[];
}

export interface ISeverityGroupView {
	severity: TSeoIssueSeverity;
	cards: IIssueCardView[];
}

const pagesOf = (row: TReportIssue, currentPages: number): number => {
	switch (row.location.kind) {
		case "page":
			return 1;
		case "allPages":
			return row.location.pageCount;
		case "site":
			return currentPages;
	}
};

/**
 * "By issue": Critical first, and within a level the problem that touches the most pages
 * first — what to fix first, in reading order (plan D9, D19). Ties fall back to catalogue
 * order, so the order never changes between two reads of the same data.
 */
export function groupByIssue(
	issues: readonly TReportIssue[],
	currentPages: number,
): ISeverityGroupView[] {
	const cards = new Map<TReportCode, IIssueCardView>();
	for (const row of issues) {
		const card = cards.get(row.code) ?? {
			code: row.code,
			severity: row.severity,
			affectedPages: 0,
			wholeSite: false,
			rows: [],
		};
		card.rows.push(row);
		card.affectedPages += pagesOf(row, currentPages);
		card.wholeSite ||= row.location.kind !== "page";
		cards.set(row.code, card);
	}
	return SEO_ISSUE_SEVERITIES.map((severity) => ({
		severity,
		cards: [...cards.values()]
			.filter((card) => card.severity === severity)
			.sort(
				(a, b) =>
					b.affectedPages - a.affectedPages ||
					catalogueOrderOf(a.code) - catalogueOrderOf(b.code),
			),
	})).filter((group) => group.cards.length > 0);
}
