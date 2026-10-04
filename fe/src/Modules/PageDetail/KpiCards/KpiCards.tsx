import { SimpleGrid, Text } from "@mantine/core";
import type { TPageDetail } from "@Gateways/PageGateway/Validation/PageSchemas";
import { PositionBadge } from "@Modules/_Shared/PositionBadge/PositionBadge";
import { ScoreBadge } from "@Modules/_Shared/ScoreBadge/ScoreBadge";
import { Kpi } from "./Kpi/Kpi";

/** The summary metrics, above the sections — the rank-tracker detail convention. */
export function KpiCards({ detail }: { detail: TPageDetail }) {
	const ranked = detail.keywords.filter((keyword) => keyword.latestPosition !== null);
	const average =
		ranked.length === 0
			? null
			: ranked.reduce((sum, keyword) => sum + keyword.latestPosition!, 0) / ranked.length;
	const inTop10 = ranked.filter((keyword) => keyword.latestPosition! <= 10).length;
	const errors = detail.issues.filter((issue) => issue.severity === "error").length;

	return (
		<SimpleGrid cols={{ base: 1, xs: 2, md: 5 }} spacing="md">
			{/* First, because it is the one number that says whether this page needs work.
			    What it claims: no obvious technical defects. Nothing about traffic. */}
			<Kpi
				label="Health score"
				value={<ScoreBadge score={detail.score} size={24} />}
				note={`${detail.score.applicable - detail.score.failed} of ${detail.score.applicable} checks passed`}
			/>
			<Kpi
				label="Best position"
				value={<PositionBadge position={detail.bestPosition?.position ?? null} size="lg" />}
				note={detail.bestPosition?.term ?? "Positions appear after the next seed run"}
			/>
			<Kpi
				label="Keywords"
				value={
					<Text fz={24} fw={700} className="tabular">
						{detail.keywords.length}
					</Text>
				}
				note={`${inTop10} in the top 10`}
			/>
			<Kpi
				label="Average position"
				value={
					<Text fz={24} fw={700} className="tabular">
						{average === null ? "—" : average.toFixed(1)}
					</Text>
				}
				note="Across keywords with a position"
			/>
			<Kpi
				label="SEO issues"
				value={
					<Text fz={24} fw={700} className="tabular" c={errors > 0 ? "red" : undefined}>
						{detail.issues.length}
					</Text>
				}
				note={errors > 0 ? `${errors} error${errors === 1 ? "" : "s"}` : "No errors"}
			/>
		</SimpleGrid>
	);
}
