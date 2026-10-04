import { describe, expect, it } from "vitest";
import { explainScore } from "./explainScore";

const arithmeticOf = (applicable: number, failed: number, value: number) =>
	explainScore({ value, applicable, failed })[0];

describe("explainScore", () => {
	it("says how many of the applicable checks passed", () => {
		expect(arithmeticOf(18, 2, 89)).toContain(
			"16 of the 18 checks that applied to this page when it was crawled passed.",
		);
	});

	it("marks a quotient it had to round as approximate", () => {
		expect(arithmeticOf(18, 2, 89)).toContain("100 × 16 ÷ 18 ≈ 88.89, rounded half-up to 89.");
	});

	/**
	 * The case two decimals exist for. At one decimal this reads "= 6.3, rounded half-up
	 * to 6" — a number rounding the other way from the score printed beside it.
	 */
	it("prints an exact quotient exactly, even when it rounds down", () => {
		expect(arithmeticOf(16, 15, 6)).toContain("100 × 1 ÷ 16 = 6.25, rounded half-up to 6.");
	});

	it("says nothing about rounding when there was none", () => {
		const sentence = arithmeticOf(18, 0, 100);

		expect(sentence).toContain("100 × 18 ÷ 18 = 100.");
		expect(sentence).not.toContain("rounded");
	});

	it("never prints a quotient that rounds away from the score", () => {
		for (let applicable = 13; applicable <= 18; applicable += 1) {
			for (let failed = 0; failed <= applicable; failed += 1) {
				const value = Math.round((100 * (applicable - failed)) / applicable);
				const quotient = arithmeticOf(applicable, failed, value).match(
					/[=≈] ([\d.]+)/,
				)?.[1];

				expect(Math.round(Number(quotient))).toBe(value);
			}
		}
	});

	it("takes its band numbers from the catalogue, not from prose", () => {
		expect(explainScore({ value: 89, applicable: 18, failed: 2 })[3]).toContain(
			"49 and below is poor, 50–89 average, 90 and up good",
		);
	});

	it("states what the score does not claim", () => {
		expect(explainScore({ value: 100, applicable: 18, failed: 0 }).join(" ")).toContain(
			"not a traffic forecast",
		);
	});
});
