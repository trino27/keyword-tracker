import { SCORE_BANDS, type IPageScore } from "@app/contracts";

/**
 * Two decimals, not one. At one decimal, 1 of 16 passed prints "6.3" and the clause
 * after it says "rounded half-up to 6" — the screen would show a number rounding the
 * other way from the one beside it. At two, the quotient is either exact or visibly
 * approximate, and never contradicts the score.
 */
const QUOTIENT_DECIMALS = 2;

/** The four paragraphs of the score explainer, the first on this page's own numbers. */
export function explainScore(score: IPageScore): string[] {
	return [arithmetic(score), EQUAL_WEIGHT, DENOMINATOR, bands()];
}

function arithmetic({ value, applicable, failed }: IPageScore): string {
	const passed = applicable - failed;
	const raw = (100 * passed) / applicable;
	const shown = stripTrailingZeros(raw.toFixed(QUOTIENT_DECIMALS));
	const sign = Number(shown) === raw ? "=" : "≈";
	// "= 100, rounded half-up to 100" reads as a defect, so a whole quotient says nothing
	// about rounding: there was none.
	const rounding = shown.includes(".") ? `, rounded half-up to ${value}.` : ".";

	return (
		`${passed} of the ${applicable} checks that applied to this page when it was ` +
		`crawled passed. ` +
		`100 × ${passed} ÷ ${applicable} ${sign} ${shown}${rounding}`
	);
}

const stripTrailingZeros = (fixed: string) =>
	fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;

const EQUAL_WEIGHT =
	"Every check counts the same. Weighting by severity would invent a model of search " +
	"ranking that nobody can justify; Lighthouse weights its SEO audits equally for the " +
	"same reason. Severity decides how this screen reads, not the arithmetic.";

const DENOMINATOR =
	"The denominator is the checks that could be judged on this page. A check that could " +
	"not run — no images to look at, no title to measure — is left out rather than passed, " +
	"so the page is neither rewarded nor punished for it. It is the crawl's own count: a " +
	"check added or retired since then changes the list below, not this number, until the " +
	"page is crawled again.";

/** The band numbers come from SCORE_BANDS, so moving a band moves this sentence. */
function bands(): string {
	const [poor, average] = SCORE_BANDS;
	return (
		`${poor.max} and below is poor, ${poor.max + 1}–${average.max} average, ` +
		`${average.max + 1} and up good — Lighthouse's published thresholds, borrowed so a ` +
		"number you have seen before reads the same here. What the score says: this page has " +
		"no obvious technical defects. It is not a traffic forecast, not a comparison with a " +
		"competitor, and not a judgement of the writing."
	);
}
