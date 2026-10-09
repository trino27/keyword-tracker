import { dayInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import type { TSearchUpdate } from "@Gateways/SearchUpdateGateway/Validation/SearchUpdateSchemas";

/** One update drawn on the chart: the days it covers, as days the chart has. */
export interface IUpdateBand {
	id: string;
	title: string;
	kind: TSearchUpdate["kind"];
	url: string;
	/** Both are days present on the chart's axis, `from <= to`: where the band is drawn. */
	from: string;
	to: string;
	/**
	 * The rollout's own first and last day, in the user's zone — what the legend says.
	 * Not the band's: a band clipped to the chart's last day of data would otherwise
	 * report a rollout that ended days later as ending there.
	 */
	began: string;
	ended: string;
	/** Still rolling out at `today`. */
	ongoing: boolean;
}

/**
 * The updates that overlap the chart, clipped to the days it shows. A chart's axis is
 * its rows' days, so a band must start and end on one of them: the first shown day on
 * or after the rollout began, the last on or before it ended. An update still rolling
 * out runs to today.
 *
 * Days are the user's calendar days, as the rows' are — the same instant falls on a
 * different day in Toronto than in UTC, and a band a day off would sit beside the drop
 * it is meant to explain.
 */
export function placeSearchUpdates(
	days: string[],
	updates: TSearchUpdate[],
	timeZone: string,
	today: string,
): IUpdateBand[] {
	if (days.length === 0) return [];
	const bands: IUpdateBand[] = [];
	for (const update of updates) {
		const begin = dayInZone(update.begin, timeZone);
		const end = update.end ? dayInZone(update.end, timeZone) : today;
		const from = days.find((day) => day >= begin);
		const to = [...days].reverse().find((day) => day <= end);
		if (!from || !to || begin > days[days.length - 1] || end < days[0]) continue;
		bands.push({
			id: update.id,
			title: update.title,
			kind: update.kind,
			url: update.url,
			from,
			// A rollout that fell between two shown days still gets its one day.
			to: to < from ? from : to,
			began: begin,
			ended: end,
			ongoing: update.end === null,
		});
	}
	return bands.sort((a, b) => a.from.localeCompare(b.from));
}
