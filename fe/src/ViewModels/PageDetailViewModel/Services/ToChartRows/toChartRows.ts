import { dayInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";

/** One row per day for the chart: `{ day, "k<keywordId>": position }`. */
export type TChartRow = { day: string } & Record<string, number | string>;

export const seriesKey = (keywordId: number) => `k${keywordId}`;

/**
 * The series pivoted into one row per day, each instant placed on the user's calendar
 * day — never the browser's.
 */
export function toChartRows(history: TPositionHistory): TChartRow[] {
	const rows = new Map<string, TChartRow>();
	for (const series of history.series) {
		for (const point of series.points) {
			const day = dayInZone(point.capturedAt, history.timeZone);
			const row = rows.get(day) ?? { day };
			row[seriesKey(series.keywordId)] = point.position;
			rows.set(day, row);
		}
	}
	return [...rows.values()].sort((a, b) => a.day.localeCompare(b.day));
}
