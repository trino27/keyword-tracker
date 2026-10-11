import { SEO_ISSUE_SEVERITIES, type TSeoIssueSeverity } from "@app/contracts";
import { catalogueOrderOf, type TReportCode } from "@Core/Helpers/IssueCopy/issueCopy";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";

/** The client a set of rows belongs to, as a heading inside a card. */
export interface IReportClient {
	id: number;
	name: string;
	site: string;
}

/** One client's share of a problem: its rows and the pages they come to. */
export interface IClientRowsView {
	/** Null when the report is one client's: the rows need no heading. */
	client: IReportClient | null;
	affectedPages: number;
	rows: TReportIssue[];
}

/** One problem, once: every place it was found, and how many pages that comes to. */
export interface IIssueCardView {
	code: TReportCode;
	severity: TSeoIssueSeverity;
	/** Pages affected — a whole-site row counts its pages, a site check the whole crawl. */
	affectedPages: number;
	/** True when the problem belongs to the site, not to listed pages. */
	wholeSite: boolean;
	rows: TReportIssue[];
	/** The rows by client, the client with most pages affected first. */
	clients: IClientRowsView[];
}

export interface ISeverityGroupView {
	severity: TSeoIssueSeverity;
	cards: IIssueCardView[];
}

/** One client's filtered rows, and how many current pages its crawl has. */
export interface IClientIssues {
	client: IReportClient | null;
	issues: readonly TReportIssue[];
	currentPages: number;
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
	return groupByIssueAcrossClients([{ client: null, issues, currentPages }]);
}

/**
 * "By issue" over several clients (plan D34): each problem is one card for all of them,
 * counting every client's pages, with the pages it was found on grouped by client inside.
 */
export function groupByIssueAcrossClients(sources: readonly IClientIssues[]): ISeverityGroupView[] {
	const cards = new Map<TReportCode, IIssueCardView>();
	for (const { client, issues, currentPages } of sources) {
		for (const row of issues) {
			const card = cards.get(row.code) ?? {
				code: row.code,
				severity: row.severity,
				affectedPages: 0,
				wholeSite: false,
				rows: [],
				clients: [],
			};
			let share = card.clients.find((entry) => entry.client?.id === client?.id);
			if (!share) {
				share = { client, affectedPages: 0, rows: [] };
				card.clients.push(share);
			}
			const pages = pagesOf(row, currentPages);
			share.rows.push(row);
			share.affectedPages += pages;
			card.rows.push(row);
			card.affectedPages += pages;
			card.wholeSite ||= row.location.kind !== "page";
			cards.set(row.code, card);
		}
	}
	for (const card of cards.values())
		card.clients.sort(
			(a, b) =>
				b.affectedPages - a.affectedPages ||
				(a.client?.name ?? "").localeCompare(b.client?.name ?? ""),
		);
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
