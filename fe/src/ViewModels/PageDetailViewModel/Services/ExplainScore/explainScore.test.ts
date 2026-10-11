import { describe, expect, it } from "vitest";
import { pageScoreOf } from "@app/contracts";
import { explainScore } from "./explainScore";

/** 18 checks applied, worth 120 points; the failed ones cost `pointsLost`. */
const arithmeticOf = (failed: number, pointsLost: number, pointsPossible = 120) =>
	explainScore(pageScoreOf({ applicable: 18, failed, pointsPossible, pointsLost }))[0];

describe("explainScore", () => {
	it("says how many of the applicable checks passed, and what they were worth", () => {
		expect(arithmeticOf(2, 13)).toContain(
			"16 of the 18 checks that applied to this page when it was crawled passed. " +
				"The 18 were worth 120 points, and the 2 that failed cost 13 of them.",
		);
	});

	it("marks a quotient it had to round as approximate", () => {
		expect(arithmeticOf(2, 13)).toContain("100 × 107 ÷ 120 ≈ 89.17, rounded half-up to 89.");
	});

	/**
	 * The case two decimals exist for. At one decimal this reads "= 6.3, rounded half-up
	 * to 6" — a number rounding the other way from the score printed beside it.
	 */
	it("prints an exact quotient exactly, even when it rounds down", () => {
		expect(arithmeticOf(15, 15, 16)).toContain("100 × 1 ÷ 16 = 6.25, rounded half-up to 6.");
	});

	it("says nothing about rounding or cost when nothing failed", () => {
		const sentence = arithmeticOf(0, 0);

		expect(sentence).toContain("worth 120 points, and none failed.");
		expect(sentence).toContain("100 × 120 ÷ 120 = 100.");
		expect(sentence).not.toContain("rounded");
	});

	it("never prints a quotient that rounds away from the score", () => {
		for (let pointsPossible = 13; pointsPossible <= 60; pointsPossible += 1) {
			for (let pointsLost = 0; pointsLost <= pointsPossible; pointsLost += 1) {
				const score = pageScoreOf({
					applicable: 13,
					failed: 1,
					pointsPossible,
					pointsLost,
				});
				const quotient = explainScore(score)[0].match(/[=≈] ([\d.]+)/)?.[1];

				expect(Math.round(Number(quotient))).toBe(score.value);
			}
		}
	});

	it("names each severity's weight, from the contract rather than from prose", () => {
		expect(
			explainScore(
				pageScoreOf({ applicable: 18, failed: 0, pointsPossible: 120, pointsLost: 0 }),
			)[1],
		).toContain(
			"A check is worth points by its severity: Critical 10, Important 3, Improvement 1.",
		);
	});

	it("takes its band numbers from the catalogue, not from prose", () => {
		expect(
			explainScore(
				pageScoreOf({ applicable: 18, failed: 2, pointsPossible: 120, pointsLost: 13 }),
			)[3],
		).toContain("49 and below is poor, 50–89 average, 90 and up good");
	});

	it("states what the score does not claim", () => {
		expect(
			explainScore(
				pageScoreOf({ applicable: 18, failed: 0, pointsPossible: 120, pointsLost: 0 }),
			).join(" "),
		).toContain("not a traffic forecast");
	});

	it("the fifth paragraph says speed is scored separately", () => {
		const paragraphs = explainScore(
			pageScoreOf({ applicable: 18, failed: 0, pointsPossible: 120, pointsLost: 0 }),
		);

		expect(paragraphs).toHaveLength(5);
		expect(paragraphs[4]).toMatch(/^Speed is scored separately\./);
	});
});
