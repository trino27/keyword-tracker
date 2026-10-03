import type { MantineColor } from "@mantine/core";

export interface IPositionBucket {
	label: string;
	color: MantineColor;
}

/**
 * Rank-tracker convention: top 3, first page (4–10), second page (11–20), beyond.
 * The same colour for a position everywhere — list, KPI cards, table, chart legend.
 */
export function positionBucket(position: number | null): IPositionBucket {
	if (position === null) return { label: "No position yet", color: "gray" };
	if (position <= 3) return { label: "Top 3", color: "teal" };
	if (position <= 10) return { label: "Top 10", color: "green" };
	if (position <= 20) return { label: "Top 20", color: "yellow" };
	return { label: "Below 20", color: "red" };
}
