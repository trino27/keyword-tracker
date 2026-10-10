import type { MantineColor } from "@mantine/core";
import type { TSeoIssueSeverity } from "@app/contracts";

/**
 * The three levels, named for the reader who decides what to fix first, and one Record
 * for every screen that shows a severity — the report, a page's issues, the list's
 * counts, the run log — so one scale never reads as two (plan D28).
 */
export const severityLabel: Record<
	TSeoIssueSeverity,
	{ label: string; plural: string; color: MantineColor; rubric: string }
> = {
	error: {
		label: "Critical",
		plural: "Critical",
		color: "red",
		rubric: "The page will not appear in search, or drops out of it.",
	},
	warning: {
		label: "Important",
		plural: "Important",
		color: "orange",
		rubric: "The page shows, but ranks or is clicked less than it could.",
	},
	notice: {
		label: "Improvement",
		plural: "Improvements",
		color: "gray",
		rubric: "Good practice; worth doing once the above are done.",
	},
};
