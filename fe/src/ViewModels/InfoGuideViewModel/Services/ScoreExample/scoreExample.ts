import {
	pageScoreOf,
	SEO_ISSUE_SEVERITIES,
	SEVERITY_WEIGHT,
	type IPageScore,
	type TSeoIssueSeverity,
} from "@app/contracts";

type TCounts = Record<TSeoIssueSeverity, number>;

export interface IScoreScenario {
	/** How many checks of each level applied to the page. */
	applicable: TCounts;
	/** How many of those failed. */
	failed: TCounts;
	score: IPageScore;
}

/** A typical post: a few Critical checks apply, more Important ones, most are Improvements. */
const APPLICABLE: TCounts = { error: 4, warning: 14, notice: 32 };

const scenario = (failed: TCounts): IScoreScenario => {
	const points = (counts: TCounts) =>
		SEO_ISSUE_SEVERITIES.reduce(
			(sum, severity) => sum + counts[severity] * SEVERITY_WEIGHT[severity],
			0,
		);
	const total = (counts: TCounts) =>
		SEO_ISSUE_SEVERITIES.reduce((sum, severity) => sum + counts[severity], 0);
	return {
		applicable: APPLICABLE,
		failed,
		// The crawl's checks alone, so the arithmetic is one owner's and easy to follow.
		score: pageScoreOf({
			crawl: {
				applicable: total(APPLICABLE),
				failed: total(failed),
				pointsPossible: points(APPLICABLE),
				pointsLost: points(failed),
			},
			lighthouse: null,
		}),
	};
};

/**
 * Two pages that fail the same NUMBER of checks and score differently — the point of
 * weighing a check by its level — worked out with the real formula and weights, so the
 * guide's arithmetic is the product's arithmetic.
 */
export function scoreExamples(): { minor: IScoreScenario; critical: IScoreScenario } {
	return {
		minor: scenario({ error: 0, warning: 1, notice: 4 }),
		critical: scenario({ error: 1, warning: 0, notice: 4 }),
	};
}
