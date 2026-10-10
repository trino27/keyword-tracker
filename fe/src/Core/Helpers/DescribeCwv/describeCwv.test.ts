import { describe, expect, it } from "vitest";
import { cwvReadingSentence, cwvSourceLabel, cwvSourcePhrase, formatCwvValue } from "./describeCwv";

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
				{ value: 3100, band: "needsImprovement", source: "url" },
				"2026-10-09T12:00:00.000Z",
				"America/Toronto",
			),
		).toBe("LCP 3.1 s — needs improvement. Real visitors to this page, measured Oct 9.");
	});
});
