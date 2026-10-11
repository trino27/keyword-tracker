import {
	SCORE_BANDS,
	SEO_ISSUE_SEVERITIES,
	SEVERITY_WEIGHT,
	type IPageScore,
	type TPageSpeedAvailabilityState,
} from "@app/contracts";
import { severityLabel } from "@Core/Constants/severityLabel";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";

/** What the explanation needs to say whose checks the number holds. */
export interface ILighthouseScoreContext {
	state: TPageSpeedAvailabilityState;
	/** When Lighthouse last measured the page; null when it never has. */
	measuredAt: string | null;
	timeZone: string;
}

/**
 * Two decimals, not one. At one decimal, 1 of 16 passed prints "6.3" and the clause
 * after it says "rounded half-up to 6" — the screen would show a number rounding the
 * other way from the one beside it. At two, the quotient is either exact or visibly
 * approximate, and never contradicts the score.
 */
const QUOTIENT_DECIMALS = 2;

/** The six paragraphs of the score explainer, the first on this page's own numbers. */
export function explainScore(score: IPageScore, lighthouse: ILighthouseScoreContext): string[] {
	return [arithmetic(score), weights(), DENOMINATOR, bands(), SPEED, whose(score, lighthouse)];
}

function arithmetic({
	value,
	applicable,
	failed,
	pointsPossible,
	pointsLost,
	byOwner,
}: IPageScore): string {
	const kept = pointsPossible - pointsLost;
	const raw = (100 * kept) / pointsPossible;
	const shown = stripTrailingZeros(raw.toFixed(QUOTIENT_DECIMALS));
	const sign = Number(shown) === raw ? "=" : "≈";
	// "= 100, rounded half-up to 100" reads as a defect, so a whole quotient says nothing
	// about rounding: there was none.
	const rounding = shown.includes(".") ? `, rounded half-up to ${value}.` : ".";
	const cost =
		failed === 0 ? "none failed" : `the ${failed} that failed cost ${pointsLost} of them`;

	return (
		`${applicable - failed} of the ${applicable} checks that applied to this page when it ` +
		`was ${byOwner.lighthouse ? "crawled and measured" : "crawled"} passed. The ${applicable} ` +
		`were worth ${pointsPossible} points, and ${cost}. ` +
		`100 × ${kept} ÷ ${pointsPossible} ${sign} ${shown}${rounding}`
	);
}

const stripTrailingZeros = (fixed: string) =>
	fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;

/** The weights come from SEVERITY_WEIGHT, so changing one changes this sentence. */
function weights(): string {
	const scale = SEO_ISSUE_SEVERITIES.map(
		(severity) => `${severityLabel[severity].label} ${SEVERITY_WEIGHT[severity]}`,
	).join(", ");
	return (
		`A check is worth points by its severity: ${scale}. A failure that ` +
		"keeps the page out of search costs more than good practice left undone, and the " +
		"total is weighed the same way, so a page that passes everything that applied " +
		"scores 100 whichever checks those were."
	);
}

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

/**
 * Said outright, because the issue count above includes speed findings and the score
 * does not: without this sentence a 100 beside an Important speed issue reads as a bug.
 */
const SPEED =
	"Speed is scored separately. Core Web Vitals are shown in the Speed block and count as " +
	"issues below, but they do not change this score — the way Lighthouse keeps SEO and " +
	"Performance apart.";

const NOT_IN_THE_NUMBER: Record<TPageSpeedAvailabilityState, string> = {
	active:
		"Lighthouse's checks are not in this number yet: Lighthouse has not measured this page. " +
		"The score will move when they are measured.",
	notConfigured:
		"Lighthouse's checks are not in this number: PageSpeed is not configured. With a key, " +
		"they join it after the page's next measurement, and the score will move.",
	keyRejected:
		"Lighthouse's checks are not in this number: Google rejected the PageSpeed key. They join " +
		"it once the key is fixed and the page is measured, and the score will move.",
};

/**
 * Whose checks the number holds (PAGEDETAIL-012). Said outright, because Lighthouse joins the
 * score hours after a crawl: without this a page's score moving with no change to the page
 * would be unexplained.
 */
function whose({ applicable, byOwner }: IPageScore, lighthouse: ILighthouseScoreContext): string {
	const theirs = byOwner.lighthouse;
	if (theirs === null) return NOT_IN_THE_NUMBER[lighthouse.state];
	const ours = byOwner.crawl?.applicable ?? 0;
	const when = lighthouse.measuredAt
		? ` from its run on ${formatInZone(lighthouse.measuredAt, lighthouse.timeZone)}`
		: "";
	return (
		`Of these ${applicable} checks, ${ours} are ours, from the crawl, and ${theirs.applicable} ` +
		`are Lighthouse's${when}. Where both of us judge the same thing, each verdict counts.`
	);
}
