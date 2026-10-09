import { describe, expect, it } from "vitest";
import type { TSearchUpdate } from "@Gateways/SearchUpdateGateway/Validation/SearchUpdateSchemas";
import { placeSearchUpdates } from "./placeSearchUpdates";

const update = (overrides: Partial<TSearchUpdate>): TSearchUpdate => ({
	id: "u",
	title: "May 2026 core update",
	kind: "core",
	begin: "2026-05-21T15:40:00.000Z",
	end: "2026-06-02T08:00:00.000Z",
	url: "https://status.search.google.com/incidents/u",
	...overrides,
});

const days = (from: number, to: number, month = "05") =>
	Array.from(
		{ length: to - from + 1 },
		(_, n) => `2026-${month}-${String(from + n).padStart(2, "0")}`,
	);

describe("placeSearchUpdates", () => {
	it("clips an update to the days the chart shows", () => {
		expect(
			placeSearchUpdates(days(25, 31), [update({})], "America/Toronto", "2026-10-09"),
		).toEqual([
			expect.objectContaining({
				from: "2026-05-25",
				to: "2026-05-31",
				began: "2026-05-21",
				ended: "2026-06-02",
				ongoing: false,
			}),
		]);
	});

	// 2026-06-02T02:00Z is still June 1 in Toronto: the band ends where the user's day does.
	it("places the rollout on the user's calendar days", () => {
		const [band] = placeSearchUpdates(
			[...days(28, 31), "2026-06-01", "2026-06-02"],
			[update({ end: "2026-06-02T02:00:00.000Z" })],
			"America/Toronto",
			"2026-10-09",
		);

		expect(band.to).toBe("2026-06-01");
	});

	it("runs an update still rolling out to today", () => {
		const [band] = placeSearchUpdates(
			days(1, 9, "10"),
			[update({ begin: "2026-10-05T12:00:00.000Z", end: null })],
			"America/Toronto",
			"2026-10-09",
		);

		expect(band).toMatchObject({ from: "2026-10-05", to: "2026-10-09", ongoing: true });
	});

	it("leaves out an update outside the range", () => {
		expect(
			placeSearchUpdates(days(1, 9, "10"), [update({})], "America/Toronto", "2026-10-09"),
		).toEqual([]);
		expect(placeSearchUpdates([], [update({})], "America/Toronto", "2026-10-09")).toEqual([]);
	});
});
