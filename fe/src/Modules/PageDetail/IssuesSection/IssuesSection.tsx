import { Badge, Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
	IconAlertOctagon,
	IconAlertTriangle,
	IconCircleCheck,
	IconInfoCircle,
} from "@tabler/icons-react";
import type { TSeoIssueSeverity } from "@app/contracts";
import type { TSeoIssue } from "@Gateways/PageGateway/Validation/PageSchemas";
import { groupIssues } from "@ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues";

const SEVERITY: Record<TSeoIssueSeverity, { title: string; color: string; icon: React.ReactNode }> =
	{
		error: { title: "Errors", color: "red", icon: <IconAlertOctagon size={16} /> },
		warning: { title: "Warnings", color: "yellow", icon: <IconAlertTriangle size={16} /> },
		notice: { title: "Notices", color: "gray", icon: <IconInfoCircle size={16} /> },
	};

/** What the last fetch found wrong, worst first, each with what to do about it. */
export function IssuesSection({ issues }: { issues: TSeoIssue[] }) {
	const groups = groupIssues(issues);
	return (
		<Stack gap="sm">
			<Title order={4}>SEO issues</Title>
			{groups.length === 0 ? (
				<Paper withBorder radius="md" p="md">
					<Group gap="sm">
						<ThemeIcon color="teal" variant="light" radius="xl">
							<IconCircleCheck size={16} />
						</ThemeIcon>
						<Text size="sm">No issues found on the last crawl.</Text>
					</Group>
				</Paper>
			) : (
				groups.map((group) => (
					<Paper key={group.severity} withBorder radius="md" p="md">
						<Stack gap="sm">
							<Group gap="xs">
								<ThemeIcon
									color={SEVERITY[group.severity].color}
									variant="light"
									size="sm"
								>
									{SEVERITY[group.severity].icon}
								</ThemeIcon>
								<Text fw={600} size="sm">
									{SEVERITY[group.severity].title}
								</Text>
								<Badge
									color={SEVERITY[group.severity].color}
									variant="light"
									size="sm"
								>
									{group.issues.length}
								</Badge>
							</Group>
							{group.issues.map((issue) => (
								<Stack key={issue.code} gap={2} pl="xl">
									<Text size="sm" fw={500}>
										{issue.label}
									</Text>
									<Text size="sm">{issue.detail}</Text>
									<Text size="xs" c="dimmed">
										{issue.hint}
									</Text>
								</Stack>
							))}
						</Stack>
					</Paper>
				))
			)}
		</Stack>
	);
}
