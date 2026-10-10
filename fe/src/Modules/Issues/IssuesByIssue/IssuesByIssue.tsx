import { Badge, Group, Stack, Text } from "@mantine/core";
import { severityLabel } from "@Core/Constants/severityLabel";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { groupByIssue } from "@ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue";
import { IssueCard } from "../IssueCard/IssueCard";

interface IIssuesByIssueProps {
	issues: TReportIssue[];
	currentPages: number;
}

/** One section per level, Critical first; within it, the widest problem first. */
export function IssuesByIssue({ issues, currentPages }: IIssuesByIssueProps) {
	return (
		<Stack gap="lg">
			{groupByIssue(issues, currentPages).map((group) => {
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
