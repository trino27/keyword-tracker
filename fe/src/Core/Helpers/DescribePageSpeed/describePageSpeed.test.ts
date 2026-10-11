import { describe, expect, it } from "vitest";
import type { IPageSpeedMeasurement, IPageSpeedSummary } from "@app/contracts";
import { pageSpeedViewOf } from "./describePageSpeed";

const MEASUREMENT: IPageSpeedMeasurement = {
	measuredAt: "2026-10-08T12:00:00.000Z",
	lcp: { value: 3100, band: "needsImprovement", source: "url" },
	inp: null,
	cls: { value: 0.02, band: "good", source: "lab" },
	performanceScore: 70,
};

const summary = (overrides: Partial<IPageSpeedSummary>): IPageSpeedSummary => ({
	status: "queued",
	measurement: null,
	lastError: null,
	...overrides,
});

const ACTIVE = { state: "active" } as const;

describe("pageSpeedViewOf", () => {
	it("says PageSpeed is not configured when there is no key and nothing measured", () => {
		expect(pageSpeedViewOf(summary({}), { state: "notConfigured" })).toEqual({
			kind: "notConfigured",
		});
	});

	it("says a page never queued was not measured", () => {
		expect(pageSpeedViewOf(null, ACTIVE)).toEqual({ kind: "notMeasured" });
	});

	it("a queued page is waiting its turn, not being measured", () => {
		expect(pageSpeedViewOf(summary({ status: "queued" }), ACTIVE)).toEqual({ kind: "queued" });
	});

	it("a running page is being measured", () => {
		expect(pageSpeedViewOf(summary({ status: "running" }), ACTIVE)).toEqual({
			kind: "measuring",
		});
	});

	it("a waiting page reads Paused under a rejected key", () => {
		expect(pageSpeedViewOf(summary({}), { state: "keyRejected" })).toEqual({
			kind: "paused",
		});
	});

	it("a page given up on says why, in plain words", () => {
		expect(
			pageSpeedViewOf(summary({ status: "failed", lastError: "PAGE_LOAD_FAILED" }), ACTIVE),
		).toEqual({ kind: "couldNotMeasure", reason: "Google could not load the page." });
	});

	it("shows a measurement, and why the latest refresh failed", () => {
		expect(
			pageSpeedViewOf(
				summary({
					status: "failed",
					measurement: MEASUREMENT,
					lastError: "PSI_UNAVAILABLE",
				}),
				ACTIVE,
			),
		).toEqual({
			kind: "measured",
			measurement: MEASUREMENT,
			refreshFailed: "Google's PageSpeed service did not answer after several tries.",
		});
	});

	it("keeps showing stored figures after the key is rejected or removed", () => {
		for (const state of ["keyRejected", "notConfigured"] as const) {
			expect(
				pageSpeedViewOf(summary({ status: "done", measurement: MEASUREMENT }), { state }),
			).toMatchObject({ kind: "measured", refreshFailed: null });
		}
	});
});
