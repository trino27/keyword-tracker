import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { ScoreExplainer } from "./ScoreExplainer";

const render = (applicable: number, failed: number, value: number) =>
	renderWithProviders(() => <ScoreExplainer score={{ value, applicable, failed }} />);

describe("ScoreExplainer", () => {
	it("does the arithmetic on this page's own numbers", async () => {
		render(18, 2, 89);

		expect(
			await screen.findByText(/100 × 16 ÷ 18 ≈ 88\.89, rounded half-up to 89\./),
		).toBeInTheDocument();
	});

	it("explains why severity does not weigh on the number", async () => {
		render(18, 2, 89);

		expect(await screen.findByText(/Every check counts the same\./)).toBeInTheDocument();
	});

	it("explains that a check which could not run is left out, not passed", async () => {
		render(16, 1, 94);

		expect(
			await screen.findByText(/left out rather than passed, so the page is neither rewarded/),
		).toBeInTheDocument();
	});

	it("says plainly what the score is not", async () => {
		render(18, 0, 100);

		expect(await screen.findByText(/not a traffic forecast/)).toBeInTheDocument();
	});
});
