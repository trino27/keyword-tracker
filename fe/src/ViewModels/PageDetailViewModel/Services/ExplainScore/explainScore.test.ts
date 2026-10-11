import { describe, expect, it } from "vitest";
import { pageScoreOf, type IOwnerCounts } from "@app/contracts";
import { explainScore } from "./explainScore";

const UNMEASURED = { state: "active", measuredAt: null, timeZone: "America/Toronto" } as const;

/** A page only the crawl has judged; Lighthouse adds nothing to the number. */
const crawlOnly = (crawl: IOwnerCounts) => pageScoreOf({ crawl, lighthouse: null });

/** 18 checks applied, worth 120 points; the failed ones cost `pointsLost`. */
const arithmeticOf = (failed: number, pointsLost: number, pointsPossible = 120) =>
	explainScore(crawlOnly({ applicable: 18, failed, pointsPossible, pointsLost }), UNMEASURED)[0];

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
				const score = crawlOnly({
					applicable: 13,
					failed: 1,
					pointsPossible,
					pointsLost,
				});
				const quotient = explainScore(score, UNMEASURED)[0].match(/[=≈] ([\d.]+)/)?.[1];

				expect(Math.round(Number(quotient))).toBe(score.value);
			}
		}
	});

	it("names each severity's weight, from the contract rather than from prose", () => {
		expect(
			explainScore(
				crawlOnly({ applicable: 18, failed: 0, pointsPossible: 120, pointsLost: 0 }),
				UNMEASURED,
			)[1],
		).toContain(
			"A check is worth points by its severity: Critical 10, Important 3, Improvement 1.",
		);
	});

	it("takes its band numbers from the catalogue, not from prose", () => {
		expect(
			explainScore(
				crawlOnly({ applicable: 18, failed: 2, pointsPossible: 120, pointsLost: 13 }),
				UNMEASURED,
			)[3],
		).toContain("49 and below is poor, 50–89 average, 90 and up good");
	});

	it("states what the score does not claim", () => {
		expect(
			explainScore(
				crawlOnly({ applicable: 18, failed: 0, pointsPossible: 120, pointsLost: 0 }),
				UNMEASURED,
			).join(" "),
		).toContain("not a traffic forecast");
	});

	it("the fifth paragraph says speed is scored separately", () => {
		const paragraphs = explainScore(
			crawlOnly({ applicable: 18, failed: 0, pointsPossible: 120, pointsLost: 0 }),
			UNMEASURED,
		);

		expect(paragraphs).toHaveLength(6);
		expect(paragraphs[4]).toMatch(/^Speed is scored separately\./);
	});

	/** PAGEDETAIL-012 "a page with Lighthouse verdicts". */
	it("says how many of the checks are ours and how many Lighthouse's, and from when", () => {
		const paragraphs = explainScore(
			pageScoreOf({
				crawl: { applicable: 16, failed: 2, pointsPossible: 100, pointsLost: 11 },
				lighthouse: { applicable: 20, failed: 3, pointsPossible: 60, pointsLost: 9 },
			}),
			{ state: "active", measuredAt: "2026-10-11T16:00:00Z", timeZone: "America/Toronto" },
		);

		expect(paragraphs[0]).toContain("100 × 140 ÷ 160 = 87.5, rounded half-up to 88.");
		expect(paragraphs[0]).toContain("when it was crawled and measured passed.");
		expect(paragraphs[5]).toBe(
			"Of these 36 checks, 16 are ours, from the crawl, and 20 are Lighthouse's from its " +
				"run on Oct 11, 2026. Where both of us judge the same thing, each verdict counts.",
		);
	});

	/** PAGEDETAIL-012 "a page Lighthouse has not measured". */
	it.each([
		["active", /not in this number yet.*will move when they are measured/],
		["notConfigured", /PageSpeed is not configured/],
		["keyRejected", /Google rejected the PageSpeed key/],
	] as const)("says why Lighthouse is not in the number when PageSpeed is %s", (state, line) => {
		const score = crawlOnly({ applicable: 18, failed: 2, pointsPossible: 120, pointsLost: 13 });

		expect(explainScore(score, { ...UNMEASURED, state })[5]).toMatch(line);
	});
});
