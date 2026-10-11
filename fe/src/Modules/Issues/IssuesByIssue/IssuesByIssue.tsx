import { Badge, Group, Stack, Text } from "@mantine/core";
import { severityLabel } from "@Core/Constants/severityLabel";
import type { ISeverityGroupView } from "@ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue";
import { IssueCard } from "../IssueCard/IssueCard";

/**
 * One section per level, Critical first; within it, the widest problem first — one
 * client's problems, or every client's with their pages grouped by client in each card.
 */
export function IssuesByIssue({ groups }: { groups: ISeverityGroupView[] }) {
	return (
		<Stack gap="lg">
			{groups.map((group) => {
				const level = severityLabel[group.severity];
				return (
					<Stack key={group.severity} gap="sm">
						<Group gap="xs">
							<Text fw={700}>{level.plural}</Text>
							<Badge color={level.color} variant="light" size="sm">
								{group.cards.length}
							</Badge>
						</Group>
						{group.cards.map((card) => (
							<IssueCard key={card.code} card={card} />
						))}
					</Stack>
				);
			})}
		</Stack>
	);
}
