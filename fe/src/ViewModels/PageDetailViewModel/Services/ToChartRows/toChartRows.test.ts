import { describe, expect, it } from "vitest";
import { toChartRows } from "./toChartRows";

describe("toChartRows", () => {
	it("pivots series into day rows, on the user's calendar", () => {
		const rows = toChartRows({
			from: "2026-11-01",
			to: "2026-11-02",
			timeZone: "America/Toronto",
			series: [
				{
					keywordId: 1,
					term: "a",
					points: [
						{ capturedAt: "2026-11-01T12:00:00.000Z", position: 5 },
						// 03:00 UTC on Nov 3 is still Nov 2 in Toronto.
						{ capturedAt: "2026-11-03T03:00:00.000Z", position: 6 },
					],
				},
				{
					keywordId: 2,
					term: "b",
					points: [{ capturedAt: "2026-11-01T12:00:00.000Z", position: 40 }],
				},
			],
		});

		expect(rows).toEqual([
			{ day: "2026-11-01", k1: 5, k2: 40 },
			{ day: "2026-11-02", k1: 6 },
		]);
	});
});
