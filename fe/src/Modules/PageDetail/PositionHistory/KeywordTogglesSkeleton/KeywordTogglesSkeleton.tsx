import { Group, Skeleton } from "@mantine/core";

/**
 * Stands in for the keyword chips until the history arrives. Without it the range
 * buttons appeared at once, the space under them stayed blank, and the chips then
 * dropped in and pushed the chart down — the reader could not tell a page with no
 * keywords from one still loading. Same height and shape as a chip, so nothing moves.
 */
export function KeywordTogglesSkeleton() {
	return (
		<Group gap={6} wrap="wrap" aria-label="Loading keywords">
			{[112, 84, 136, 96, 120].map((width) => (
				<Skeleton key={width} height={26} width={width} radius="xl" />
			))}
		</Group>
	);
}
