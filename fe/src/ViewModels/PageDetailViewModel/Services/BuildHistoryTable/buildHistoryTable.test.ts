import { describe, expect, it } from "vitest";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { buildHistoryTable } from "./buildHistoryTable";

const at = (day: string) => `${day}T12:00:00.000Z`;

const HISTORY: TPositionHistory = {
	from: "2026-09-01",
	to: "2026-09-03",
	timeZone: "America/Toronto",
	series: [
		{
			keywordId: 1,
			term: "remove www",
			points: [
				{ capturedAt: at("2026-09-01"), position: 12 },
				{ capturedAt: at("2026-09-02"), position: 15 },
				{ capturedAt: at("2026-09-03"), position: 8 },
			],
		},
		{ keywordId: 2, term: "new keyword", points: [] },
	],
};

describe("buildHistoryTable", () => {
	it("gives latest, change (gained places), best and worst", () => {
		expect(buildHistoryTable(HISTORY)[0]).toEqual({
			keywordId: 1,
			term: "remove www",
			latest: 8,
			change: 4,
			best: 8,
			worst: 15,
			points: 3,
		});
	});

	it("a falling keyword has a negative change", () => {
		const falling = buildHistoryTable({
			...HISTORY,
			series: [
				{
					keywordId: 1,
					term: "x",
					points: [
						{ capturedAt: at("2026-09-01"), position: 3 },
						{ capturedAt: at("2026-09-02"), position: 9 },
					],
				},
			],
		});

		expect(falling[0].change).toBe(-6);
	});

	it("a keyword without points keeps its row, empty", () => {
		expect(buildHistoryTable(HISTORY)[1]).toMatchObject({
			latest: null,
			change: null,
			points: 0,
		});
	});
});
