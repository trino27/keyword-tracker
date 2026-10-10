import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { SEO_ISSUE_SEVERITIES } from "@app/contracts";
import { severityLabel } from "@Core/Constants/severityLabel";

/** How the levels are decided, always in view: the reader's guide to what to fix first. */
export function SeverityRubric() {
	return (
		<Paper withBorder radius="md" p="sm" aria-label="What the levels mean">
			<Stack gap={4}>
				{SEO_ISSUE_SEVERITIES.map((severity) => (
					<Group key={severity} gap="xs" wrap="nowrap" align="flex-start">
						<Badge color={severityLabel[severity].color} variant="light" w={110}>
							{severityLabel[severity].label}
						</Badge>
						<Text size="sm">{severityLabel[severity].rubric}</Text>
					</Group>
				))}
			</Stack>
		</Paper>
	);
}
