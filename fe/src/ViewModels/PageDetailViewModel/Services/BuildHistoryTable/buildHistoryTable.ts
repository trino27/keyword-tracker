import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";

export interface IHistoryRow {
	keywordId: number;
	term: string;
	latest: number | null;
	/**
	 * Places gained over the range: first position minus latest. Positive is better —
	 * a lower number ranks higher.
	 */
	change: number | null;
	best: number | null;
	worst: number | null;
	points: number;
}

/** One row per keyword: where it is now, how it moved, its best and worst in the range. */
export function buildHistoryTable(history: TPositionHistory): IHistoryRow[] {
	return history.series.map((series) => {
		const positions = series.points.map((point) => point.position);
		if (positions.length === 0) {
			return {
				keywordId: series.keywordId,
				term: series.term,
				latest: null,
				change: null,
				best: null,
				worst: null,
				points: 0,
			};
		}
		const first = positions[0];
		const latest = positions[positions.length - 1];
		return {
			keywordId: series.keywordId,
			term: series.term,
			latest,
			change: positions.length > 1 ? first - latest : null,
			best: Math.min(...positions),
			worst: Math.max(...positions),
			points: positions.length,
		};
	});
}
