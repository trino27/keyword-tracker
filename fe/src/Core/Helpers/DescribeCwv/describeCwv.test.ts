import { describe, expect, it } from "vitest";
import {
	cwvReadingSentence,
	cwvSourceLabel,
	cwvSourcePhrase,
	formatCwvValue,
	formatTtfb,
	lcpPhaseShares,
	visitShareSentence,
} from "./describeCwv";

describe("formatCwvValue", () => {
	it.each([
		["lcp", 3100, "3.1 s"],
		["lcp", 2500, "2.5 s"],
		["lcp", 4000, "4 s"],
		["inp", 180, "180 ms"],
		["inp", 512.4, "512 ms"],
		["cls", 0.12, "0.12"],
		["cls", 0.1, "0.1"],
		["cls", 0.25, "0.25"],
		["cls", 0.123456, "0.12"],
		// Never print a threshold the value is past: one more digit instead.
		["lcp", 2540, "2.54 s"],
		["lcp", 4040, "4.04 s"],
		["inp", 200.4, "200.4 ms"],
		["cls", 0.104, "0.104"],
		["cls", 0.2504, "0.2504"],
	] as const)("%s %d reads %s", (metric, value, text) => {
		expect(formatCwvValue(metric, value)).toBe(text);
	});
});

describe("cwvSourcePhrase", () => {
	it("says whose experience the value is", () => {
		expect(cwvSourcePhrase("url")).toBe("this page's real visitors");
		expect(cwvSourcePhrase("origin")).toBe("the whole site's real visitors");
		expect(cwvSourcePhrase("lab")).toBe("a lab test, which may vary");
	});
});

describe("cwvSourceLabel", () => {
	it("names the source as a badge tooltip does", () => {
		expect(cwvSourceLabel("url")).toBe("Real visitors to this page");
		expect(cwvSourceLabel("origin")).toBe("Real visitors to the whole site");
		expect(cwvSourceLabel("lab")).toBe("Lab test, may vary");
	});
});

describe("cwvReadingSentence", () => {
	it("says the value, the band, whose it is and when, in the user's zone", () => {
		expect(
			cwvReadingSentence(
				"lcp",
				{ value: 3100, band: "needsImprovement", source: "url", share: null },
				"2026-10-09T12:00:00.000Z",
				"America/Toronto",
			),
		).toBe("LCP 3.1 s — needs improvement. Real visitors to this page, measured Oct 9.");
	});
});

describe("visitShareSentence", () => {
	it("splits the visits into three shares that add up to 100", () => {
		expect(visitShareSentence({ good: 0.68, poor: 0.11 })).toBe(
			"68% of visits good, 21% need improvement, 11% poor",
		);
	});
});

describe("formatTtfb", () => {
	it("reads milliseconds under a second and seconds above", () => {
		expect(formatTtfb(620)).toBe("620 ms");
		expect(formatTtfb(1485)).toBe("1.5 s");
	});
});

describe("lcpPhaseShares", () => {
	/** PAGEDETAIL-013 "an image LCP". */
	it("gives each phase its share of the breakdown's own total", () => {
		expect(
			lcpPhaseShares({
				element: null,
				phases: [
					{ phase: "timeToFirstByte", ms: 6 },
					{ phase: "resourceLoadDelay", ms: 736 },
					{ phase: "resourceLoadDuration", ms: 43 },
					{ phase: "elementRenderDelay", ms: 1529 },
				],
			}).map(({ percent }) => percent),
		).toEqual([0, 32, 2, 66]);
	});
});
