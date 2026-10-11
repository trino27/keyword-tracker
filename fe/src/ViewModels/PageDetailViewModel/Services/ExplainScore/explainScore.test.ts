import { describe, expect, it } from "vitest";
import { explainScore } from "./explainScore";

const UNMEASURED = { state: "active", measuredAt: null, timeZone: "America/Toronto" } as const;

/** A page only the crawl has judged. */
const crawlOnly = (applicable: number, failed: number, value: number) => ({
	value,
	applicable,
	failed,
	byOwner: { crawl: { applicable, failed }, lighthouse: null },
});

const arithmeticOf = (applicable: number, failed: number, value: number) =>
	explainScore(crawlOnly(applicable, failed, value), UNMEASURED)[0];

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
		expect(explainScore(crawlOnly(18, 2, 89), UNMEASURED)[3]).toContain(
			"49 and below is poor, 50–89 average, 90 and up good",
		);
	});

	it("states what the score does not claim", () => {
		expect(explainScore(crawlOnly(18, 0, 100), UNMEASURED).join(" ")).toContain(
			"not a traffic forecast",
		);
	});

	it("the fifth paragraph says speed is scored separately", () => {
		const paragraphs = explainScore(crawlOnly(18, 0, 100), UNMEASURED);

		expect(paragraphs).toHaveLength(6);
		expect(paragraphs[4]).toMatch(/^Speed is scored separately\./);
	});

	/** PAGEDETAIL-012 "a page with Lighthouse verdicts". */
	it("says how many of the checks are ours and how many Lighthouse's, and from when", () => {
		const paragraphs = explainScore(
			{
				value: 86,
				applicable: 36,
				failed: 5,
				byOwner: {
					crawl: { applicable: 16, failed: 2 },
					lighthouse: { applicable: 20, failed: 3 },
				},
			},
			{ state: "active", measuredAt: "2026-10-11T16:00:00Z", timeZone: "America/Toronto" },
		);

		expect(paragraphs[0]).toContain("100 × 31 ÷ 36 ≈ 86.11, rounded half-up to 86.");
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
		expect(explainScore(crawlOnly(18, 2, 89), { ...UNMEASURED, state })[5]).toMatch(line);
	});
});
