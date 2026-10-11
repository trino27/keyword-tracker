import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { pageScoreOf } from "@app/contracts";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { ScoreExplainer } from "./ScoreExplainer";

const render = (applicable: number, failed: number, pointsPossible: number, pointsLost: number) =>
	renderWithProviders(() => (
		<ScoreExplainer score={pageScoreOf({ applicable, failed, pointsPossible, pointsLost })} />
	));

describe("ScoreExplainer", () => {
	it("does the arithmetic on this page's own points", async () => {
		render(18, 2, 120, 13);

		expect(
			await screen.findByText(/100 × 107 ÷ 120 ≈ 89\.17, rounded half-up to 89\./),
		).toBeInTheDocument();
	});

	it("explains that severity decides what a check is worth", async () => {
		render(18, 2, 120, 13);

		expect(
			await screen.findByText(/A check is worth points by its severity/),
		).toBeInTheDocument();
	});

	it("explains that a check which could not run is left out, not passed", async () => {
		render(16, 1, 60, 3);

		expect(
			await screen.findByText(/left out rather than passed, so the page is neither rewarded/),
		).toBeInTheDocument();
	});

	it("says plainly what the score is not", async () => {
		render(18, 0, 120, 0);

		expect(await screen.findByText(/not a traffic forecast/)).toBeInTheDocument();
	});
});
