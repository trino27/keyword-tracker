import {
	ACTIVE_ISSUE_CODES,
	ACTIVE_LIGHTHOUSE_CODES,
	SEO_ISSUE_CATALOGUE,
	counterpartGroupOf,
	whyCounterpartsDiffer,
	skipReasonOf,
	type ICounterpartGroup,
	type TCheckStatus,
	type TChecksByOwner,
	type TLighthouseIssueCode,
	type TPageSpeedAvailabilityState,
	type TScoredIssueOwner,
	type TSeoIssueCode,
} from "@app/contracts";
import { CHECK_TOPICS, CHECK_TOPIC_OF, type TCheckTopicId } from "@Core/Constants/checkTopics";

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
	/** Why the two can differ on this row — `WHY_COUNTERPARTS_DIFFER` — when they do. */
	why: string | null;
}

/** One chapter of checks (`CHECK_TOPICS`), as the Info tab names it. */
export interface ICheckSection {
	heading: string;
	rows: ICheckRow[];
	/** Rows in this chapter with at least one failed check, of either owner. */
	failed: number;
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
 * A row is a counterpart group (`ISSUE_COUNTERPARTS`) or a code no other owner checks;
 * where Lighthouse judges what we judge, its verdict sits beside ours on one row. Rows
 * are grouped into the chapters of `CHECK_TOPICS` — the Info tab's, in its order — a
 * group under the chapter of our code, failures first within each. Nothing is derived
 * here: every status is the one the backend composed, and an owner with no record shows a
 * line, never invented cells.
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
					label: labelOf(code, status),
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
		const differ = disagree(crawl, lighthouse);
		return {
			key,
			cells: { crawl, lighthouse },
			disagree: differ,
			why: differ ? whyCounterpartsDiffer(code) : null,
		};
	};

	// Every row once: our codes in the order the backend sent them, a counterpart group on
	// the row of its first code, then the Lighthouse codes no check of ours shares.
	const rows: { topic: TCheckTopicId; row: ICheckRow }[] = [];
	const placed = new Set<ICounterpartGroup>();
	const crawlOrder = byOwner.crawl?.map(({ code }) => code) ?? ACTIVE_ISSUE_CODES;
	for (const code of crawlOrder) {
		const group = counterpartGroupOf(code);
		if (group && placed.has(group)) continue;
		if (group) placed.add(group);
		rows.push({ topic: CHECK_TOPIC_OF[code], row: rowOf(code, group, code) });
	}
	for (const code of ACTIVE_LIGHTHOUSE_CODES)
		if (counterpartGroupOf(code) === null)
			rows.push({ topic: CHECK_TOPIC_OF[code], row: rowOf(code, null, code) });

	// The chapters the Info tab teaches, in its reading order, so a check sits under the
	// same heading on both screens. Failures lead each chapter; the order is kept within.
	const sections = CHECK_TOPICS.map(({ id, title }) => {
		const inTopic = rows
			.filter(({ topic, row }) => topic === id && hasCells(row))
			.map(({ row }) => row)
			.sort((a, b) => Number(isFailed(b)) - Number(isFailed(a)));
		return { heading: title, rows: inTopic, failed: inTopic.filter(isFailed).length };
	}).filter((section) => section.rows.length > 0);

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

/**
 * A passed check reads as what is right — "Language is declared" — and every other status
 * as the problem it looks for. The problem's name beside a green mark reads as if the
 * problem were the good outcome.
 */
function labelOf(code: TSeoIssueCode, status: TCheckStatus): string {
	const entry = SEO_ISSUE_CATALOGUE[code];
	return status === "passed" && "passLabel" in entry ? entry.passLabel : entry.label;
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
