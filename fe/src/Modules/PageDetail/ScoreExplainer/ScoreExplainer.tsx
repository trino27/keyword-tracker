import { Paper, Stack, Text, Title } from "@mantine/core";
import type { IPageScore } from "@app/contracts";
import { explainScore } from "@ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore";

/**
 * What the number above is, how it was reached on this page's own figures, and what it
 * is not allowed to claim. The last of those is the reason the section exists: a bare
 * 89 invites being read as a forecast or a ranking against a competitor, and it is
 * neither.
 */
export function ScoreExplainer({ score }: { score: IPageScore }) {
	return (
		<Stack gap="sm">
			<Title order={4}>How this score is calculated</Title>
			<Paper withBorder radius="md" p="md">
				<Stack gap="sm">
					{explainScore(score).map((paragraph) => (
						<Text key={paragraph.slice(0, 32)} size="sm">
							{paragraph}
						</Text>
					))}
				</Stack>
			</Paper>
		</Stack>
	);
}
