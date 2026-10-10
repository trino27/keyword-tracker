import { describe, expect, it } from "vitest";
import { cwvSourcePhrase, formatCwvValue } from "./describeCwv";

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
