import {
	PAGE_SPEED_ERRORS,
	type IPageSpeedAvailability,
	type IPageSpeedMeasurement,
	type IPageSpeedSummary,
} from "@app/contracts";

/**
 * What a page's speed cell or block shows — seven states, because absence is explained and
 * never drawn as a grey badge that could mean any of them.
 */
export type TPageSpeedView =
	/** No key: nothing has been or will be measured. */
	| { kind: "notConfigured" }
	/** The page has never been queued: crawled before PageSpeed existed. */
	| { kind: "notMeasured" }
	/** Waiting in the queue for its turn; a long queue can take an hour or more. */
	| { kind: "queued" }
	/** Google is testing it right now. */
	| { kind: "measuring" }
	/** Waiting, but the queue is halted because Google refused the key. */
	| { kind: "paused" }
	/** Given up on, and never measured. */
	| { kind: "couldNotMeasure"; reason: string }
	/**
	 * A measurement to show. `refreshFailed` names why the latest attempt failed while an
	 * older measurement still stands.
	 */
	| { kind: "measured"; measurement: IPageSpeedMeasurement; refreshFailed: string | null };

export function pageSpeedViewOf(
	summary: IPageSpeedSummary | null,
	availability: IPageSpeedAvailability,
): TPageSpeedView {
	const reason = summary?.lastError ? PAGE_SPEED_ERRORS[summary.lastError].reason : null;
	// Figures already measured stay true whatever happened to the key since.
	if (summary?.measurement)
		return { kind: "measured", measurement: summary.measurement, refreshFailed: reason };
	if (availability.state === "notConfigured") return { kind: "notConfigured" };
	if (!summary) return { kind: "notMeasured" };
	if (summary.status === "failed") return { kind: "couldNotMeasure", reason: reason ?? "" };
	if (availability.state === "keyRejected") return { kind: "paused" };
	return summary.status === "running" ? { kind: "measuring" } : { kind: "queued" };
}
