import {
	ACTIVE_ISSUE_CODES,
	LIGHTHOUSE_CATALOGUE,
	LIGHTHOUSE_ISSUE_CODES,
	SEO_ISSUE_CATALOGUE,
	counterpartGroupOf,
	skipReasonOf,
	type ICounterpartGroup,
	type TCheckStatus,
	type TChecksByOwner,
	type TLighthouseIssueCode,
	type TPageSpeedAvailabilityState,
	type TScoredIssueOwner,
	type TSeoIssueCode,
} from "@app/contracts";

/** One check of one owner, as a cell shows it. */
export interface ICheckCell {
	code: TSeoIssueCode;
	label: string;
	status: TCheckStatus;
	/** Why it was skipped, or why it has no verdict; null for a judged check. */
	reason: string | null;
}

/** One line of the section: a counterpart group, or a code no other owner checks. */
export interface ICheckRow {
	key: string;
	cells: Record<TScoredIssueOwner, ICheckCell[]>;
	/** One owner failed what the other passed (lighthouse-checks D18). */
	disagree: boolean;
}

export interface ICheckSection {
	/** Null for the first section, our checks with Lighthouse's beside them. */
	heading: string | null;
	rows: ICheckRow[];
}

export interface IChecksColumn {
	title: string;
	/** When this owner last judged the page; null when it has no record. */
	judgedAt: string | null;
	/** The one line shown in place of the column's cells, or null when it has some. */
	empty: string | null;
	/** "16 judged · 2 not applicable" — only the groups that are not empty. */
	subtitle: string;
}

export interface IChecksSummary {
	columns: Record<TScoredIssueOwner, IChecksColumn>;
	sections: ICheckSection[];
	/** Failed checks of both owners, for the line pointing at the issues below. */
	failed: number;
}

/** What the section needs besides the checks: when each owner judged, and PageSpeed's state. */
export interface IChecksContext {
	crawledAt: string;
	/** The measurement's time; null when the page has none. */
	lighthouseMeasuredAt: string | null;
	pageSpeedState: TPageSpeedAvailabilityState;
}

const TITLE: Record<TScoredIssueOwner, string> = {
	crawl: "Our checks",
	lighthouse: "Lighthouse",
};

/** Why a code has no verdict, per owner: a check added since, or an audit not reported. */
const NOT_RECORDED: Record<TScoredIssueOwner, string> = {
	crawl: "Added after this page was last crawled.",
	lighthouse: "Lighthouse did not report this audit in its last run.",
};

/** Lighthouse says "not applicable" for one reason only: nothing on the page to check. */
const LIGHTHOUSE_NOT_APPLICABLE = "Lighthouse found nothing on the page for this audit.";

const NOT_RECORDED_NOUN: Record<TScoredIssueOwner, string> = {
	crawl: "not yet checked",
	lighthouse: "not recorded",
};

const LIGHTHOUSE_EMPTY: Record<TPageSpeedAvailabilityState, string> = {
	active: "Lighthouse has not checked this page yet.",
	notConfigured: "PageSpeed is not configured, so Lighthouse has not checked this page.",
	keyRejected: "Google rejected the PageSpeed key, so Lighthouse checks are paused.",
};

const CRAWL_EMPTY = "Re-crawl this page to see each check.";

type TCheck = { code: TSeoIssueCode; status: TCheckStatus };

/**
 * The checks section in two columns, ours and Lighthouse's (PAGEDETAIL-009).
 *
 * A row is a counterpart group (`ISSUE_COUNTERPARTS`) or a code no other owner checks.
 * Our rows come first, in the order the backend sent them, each with Lighthouse's verdict
 * beside it where Lighthouse judges the same thing; then Lighthouse's own, SEO before
 * accessibility, failures first. Nothing is derived here: every status is the one the
 * backend composed, and an owner with no record shows a line, never invented cells.
 *
 * "Judged" counts passed AND failed: it is the score's denominator, which is what each
 * subtitle exists to make legible beside the number in the KPI card.
 */
export function summariseChecks(byOwner: TChecksByOwner, context: IChecksContext): IChecksSummary {
	const statusOf = new Map<string, TCheckStatus>(
		[...(byOwner.crawl ?? []), ...(byOwner.lighthouse ?? [])].map((check: TCheck) => [
			check.code,
			check.status,
		]),
	);
	const cellsOf = (owner: TScoredIssueOwner, codes: readonly TSeoIssueCode[]) =>
		codes.flatMap((code): ICheckCell[] => {
			const status = statusOf.get(code);
			if (status === undefined || byOwner[owner] === null) return [];
			return [
				{
					code,
					label: SEO_ISSUE_CATALOGUE[code].label,
					status,
					reason: reasonFor(owner, code, status),
				},
			];
		});
	const rowOf = (
		key: string,
		group: ICounterpartGroup | null,
		code: TSeoIssueCode,
	): ICheckRow => {
		const crawl = cellsOf("crawl", group?.crawl ?? (isLighthouse(code) ? [] : [code]));
		const lighthouse = cellsOf(
			"lighthouse",
			group?.lighthouse ?? (isLighthouse(code) ? [code] : []),
		);
		return { key, cells: { crawl, lighthouse }, disagree: disagree(crawl, lighthouse) };
	};

	const ours: ICheckRow[] = [];
	const placed = new Set<ICounterpartGroup>();
	const crawlOrder = byOwner.crawl?.map(({ code }) => code) ?? ACTIVE_ISSUE_CODES;
	for (const code of crawlOrder) {
		const group = counterpartGroupOf(code);
		if (group && placed.has(group)) continue;
		if (group) placed.add(group);
		ours.push(rowOf(code, group, code));
	}

	const alone = LIGHTHOUSE_ISSUE_CODES.filter((code) => counterpartGroupOf(code) === null);
	const lighthouseSection = (heading: string, codes: TLighthouseIssueCode[]): ICheckSection => ({
		heading,
		rows: codes
			.map((code) => rowOf(code, null, code))
			// Stable: failures first, the catalogue's order kept within each kind.
			.sort((a, b) => Number(isFailed(b)) - Number(isFailed(a))),
	});

	const sections = [
		{ heading: null, rows: ours },
		lighthouseSection(
			"Lighthouse · SEO",
			alone.filter((code) => "seo" in LIGHTHOUSE_CATALOGUE[code].weights),
		),
		lighthouseSection(
			"Lighthouse · Accessibility",
			alone.filter((code) => !("seo" in LIGHTHOUSE_CATALOGUE[code].weights)),
		),
	]
		.map((section) => ({ ...section, rows: section.rows.filter(hasCells) }))
		.filter((section) => section.rows.length > 0);

	return {
		columns: {
			crawl: columnOf("crawl", byOwner.crawl, context.crawledAt, CRAWL_EMPTY),
			lighthouse: columnOf(
				"lighthouse",
				byOwner.lighthouse,
				context.lighthouseMeasuredAt,
				LIGHTHOUSE_EMPTY[context.pageSpeedState],
			),
		},
		sections,
		failed: [...statusOf.values()].filter((status) => status === "failed").length,
	};
}

const isLighthouse = (code: TSeoIssueCode): code is TLighthouseIssueCode =>
	SEO_ISSUE_CATALOGUE[code].owner === "lighthouse";

const isFailed = (row: ICheckRow) =>
	[...row.cells.crawl, ...row.cells.lighthouse].some(({ status }) => status === "failed");

const hasCells = (row: ICheckRow) => row.cells.crawl.length > 0 || row.cells.lighthouse.length > 0;

/** One side failed what the other passed. Two failures, or a failure beside nothing, agree. */
function disagree(crawl: ICheckCell[], lighthouse: ICheckCell[]): boolean {
	const has = (cells: ICheckCell[], status: TCheckStatus) =>
		cells.some((cell) => cell.status === status);
	return (
		(has(crawl, "failed") && has(lighthouse, "passed")) ||
		(has(lighthouse, "failed") && has(crawl, "passed"))
	);
}

function reasonFor(
	owner: TScoredIssueOwner,
	code: TSeoIssueCode,
	status: TCheckStatus,
): string | null {
	if (status === "notYetChecked") return NOT_RECORDED[owner];
	if (status !== "notApplicable") return null;
	return owner === "lighthouse" ? LIGHTHOUSE_NOT_APPLICABLE : skipReasonOf(code);
}

function columnOf(
	owner: TScoredIssueOwner,
	checks: TCheck[] | null,
	judgedAt: string | null,
	empty: string,
): IChecksColumn {
	if (checks === null) return { title: TITLE[owner], judgedAt: null, empty, subtitle: "" };
	const count = (status: TCheckStatus) =>
		checks.filter((check) => check.status === status).length;
	const parts: [number, string][] = [
		[count("passed") + count("failed"), "judged"],
		[count("notApplicable"), "not applicable"],
		[count("notYetChecked"), NOT_RECORDED_NOUN[owner]],
	];
	return {
		title: TITLE[owner],
		judgedAt,
		empty: null,
		subtitle: parts
			.filter(([n]) => n > 0)
			.map(([n, noun]) => `${n} ${noun}`)
			.join(" · "),
	};
}
