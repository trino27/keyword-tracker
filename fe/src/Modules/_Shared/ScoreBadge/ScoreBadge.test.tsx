import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IPageScore } from "@app/contracts";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { ScoreBadge } from "./ScoreBadge";

/** The badge reads only the value and the counts; the points are filled in to match. */
const scoreOf = ({
	value,
	applicable,
	failed,
}: Pick<IPageScore, "value" | "applicable" | "failed">) => ({
	value,
	applicable,
	failed,
	pointsPossible: applicable,
	pointsLost: failed,
});

const render = (score: Pick<IPageScore, "value" | "applicable" | "failed">) =>
	renderWithProviders(() => <ScoreBadge score={scoreOf(score)} />);

describe("ScoreBadge", () => {
	it.each([
		[42, "poor"],
		[49, "poor"],
		[50, "average"],
		[89, "average"],
		[90, "good"],
		[100, "good"],
	])("a score of %d is in the %s band", async (value, band) => {
		render({ value, applicable: 18, failed: 0 });

		expect(await screen.findByTestId("score-badge")).toHaveAttribute("data-band", band);
	});

	it("shows the number", async () => {
		render({ value: 42, applicable: 18, failed: 10 });

		expect(await screen.findByText("42")).toBeInTheDocument();
	});

	// Two pages with different denominators must not silently compare as equals.
	it("names the denominator it was computed from", async () => {
		renderWithProviders(() => (
			<ScoreBadge score={scoreOf({ value: 88, applicable: 16, failed: 2 })} withNote />
		));

		expect(await screen.findByText("14/16 checks")).toBeInTheDocument();
	});

	it("leaves the note out when it is not asked for", async () => {
		render({ value: 88, applicable: 16, failed: 2 });

		await screen.findByTestId("score-badge");
		expect(screen.queryByText("14/16 checks")).not.toBeInTheDocument();
	});
});
