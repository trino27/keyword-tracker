import { describe, expect, it } from "vitest";
import { scoreBandOf, SEVERITY_WEIGHT } from "@app/contracts";
import { scoreExamples } from "./scoreExample";

describe("scoreExamples", () => {
	it("fails the same number of checks on both pages, and scores the Critical one lower", () => {
		const { minor, critical } = scoreExamples();
		expect(minor.score.failed).toBe(critical.score.failed);
		expect(critical.score.value).toBeLessThan(minor.score.value);
		expect(critical.score.pointsLost - minor.score.pointsLost).toBe(
			SEVERITY_WEIGHT.error - SEVERITY_WEIGHT.warning,
		);
	});

	it("is the product's formula: the share of points kept, rounded half-up", () => {
		const { minor } = scoreExamples();
		const { pointsPossible, pointsLost, value } = minor.score;
		expect(value).toBe(Math.round((100 * (pointsPossible - pointsLost)) / pointsPossible));
	});

	it("lands the two pages in different bands, which is what the example is for", () => {
		const { minor, critical } = scoreExamples();
		expect(scoreBandOf(minor.score.value)).not.toBe(scoreBandOf(critical.score.value));
	});
});
