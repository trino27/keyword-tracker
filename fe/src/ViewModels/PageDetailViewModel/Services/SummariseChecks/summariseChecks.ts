import {
	SEO_ISSUE_CATALOGUE,
	skipReasonOf,
	type TCheckStatus,
	type TSeoIssueCode,
} from "@app/contracts";
import type { TPageCheck } from "@Gateways/PageGateway/Validation/PageSchemas";

export interface ICheckRow {
	code: TSeoIssueCode;
	label: string;
	status: TCheckStatus;
	/** Why it was skipped, or why it has no verdict yet; null for a judged check. */
	reason: string | null;
}

export interface IChecksSummary {
	rows: ICheckRow[];
	counts: Record<TCheckStatus, number>;
	/** "16 judged · 2 not applicable" — only the groups that are not empty. */
	subtitle: string;
	failed: number;
}

/** A check the catalogue has gained since this page was last seen. */
const NOT_YET_CHECKED_REASON = "Added after this page was last crawled.";

const SUBTITLE_PARTS: { status: TCheckStatus; noun: string }[] = [
	{ status: "passed", noun: "judged" },
	{ status: "notApplicable", noun: "not applicable" },
	{ status: "notYetChecked", noun: "not yet checked" },
];

/**
 * The rows the Checks section renders, and the one line above them.
 *
 * "Judged" counts passed AND failed: it is the score's denominator, which is what the
 * subtitle exists to make legible beside the number in the KPI card. Listing passed and
 * failed separately there would invite reading the denominator as the passes alone.
 */
export function summariseChecks(checks: TPageCheck[]): IChecksSummary {
	const counts: Record<TCheckStatus, number> = {
		passed: 0,
		failed: 0,
		notApplicable: 0,
		notYetChecked: 0,
	};
	for (const check of checks) counts[check.status] += 1;

	const judged = counts.passed + counts.failed;
	const subtitle = SUBTITLE_PARTS.map(({ status, noun }) => {
		const count = status === "passed" ? judged : counts[status];
		return count > 0 ? `${count} ${noun}` : null;
	})
		.filter((part): part is string => part !== null)
		.join(" · ");

	return {
		rows: checks.map((check) => ({
			code: check.code,
			label: SEO_ISSUE_CATALOGUE[check.code].label,
			status: check.status,
			reason: reasonFor(check),
		})),
		counts,
		subtitle,
		failed: counts.failed,
	};
}

function reasonFor(check: TPageCheck): string | null {
	if (check.status === "notApplicable") return skipReasonOf(check.code);
	if (check.status === "notYetChecked") return NOT_YET_CHECKED_REASON;
	return null;
}
