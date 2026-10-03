import { describe, expect, it } from "vitest";
import { resolveRange } from "./resolveRange";

/** 01:30 UTC on Oct 3 — still Oct 2 in Toronto. */
const NOW = new Date("2026-10-03T01:30:00Z");
const TORONTO = "America/Toronto";

describe("resolveRange", () => {
	it.each([
		["7d", "2026-09-26"],
		["30d", "2026-09-03"],
		["90d", "2026-07-05"],
		["12m", "2025-10-03"],
	] as const)("%s ends today in the user's zone", (preset, from) => {
		expect(resolveRange(preset, {}, TORONTO, NOW)).toEqual({ from, to: "2026-10-02" });
	});

	it("a Tokyo user is already a day ahead", () => {
		expect(resolveRange("7d", {}, "Asia/Tokyo", NOW).to).toBe("2026-10-03");
	});

	it("a custom range is used as picked, in order", () => {
		expect(
			resolveRange("custom", { from: "2026-09-30", to: "2026-09-01" }, TORONTO, NOW),
		).toEqual({ from: "2026-09-01", to: "2026-09-30" });
	});

	it("an unfinished custom pick falls back to 30 days", () => {
		expect(resolveRange("custom", { from: "2026-09-01" }, TORONTO, NOW)).toEqual({
			from: "2026-09-03",
			to: "2026-10-02",
		});
	});
});
