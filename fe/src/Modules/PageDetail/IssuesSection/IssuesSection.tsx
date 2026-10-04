import { Anchor, Badge, Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
	IconAlertOctagon,
	IconAlertTriangle,
	IconCircleCheck,
	IconInfoCircle,
} from "@tabler/icons-react";
import type { TSeoIssueSeverity } from "@app/contracts";
import type { TDetailIssue } from "@Gateways/PageGateway/Validation/PageSchemas";
import { groupIssues } from "@ViewModels/PageDetailViewModel/Services/GroupIssues/groupIssues";

const SEVERITY: Record<TSeoIssueSeverity, { title: string; color: string; icon: React.ReactNode }> =
	{
		error: { title: "Errors", color: "red", icon: <IconAlertOctagon size={16} /> },
		warning: { title: "Warnings", color: "yellow", icon: <IconAlertTriangle size={16} /> },
		notice: { title: "Notices", color: "gray", icon: <IconInfoCircle size={16} /> },
	};

interface IIssuesSectionProps {
	issues: TDetailIssue[];
	/** Pages on the client's current crawl — the denominator of "on 5 of 15 pages". */
	currentPages: number;
}

/** What the last fetch found wrong, worst first, each with what to do about it. */
export function IssuesSection({ issues, currentPages }: IIssuesSectionProps) {
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
									<Group gap={6} wrap="wrap">
										<Text size="sm">{issue.detail}</Text>
										{/* The number that says the fix belongs in a
										    template, not on this page. */}
										{issue.pagesAffected > 1 && (
											<Text size="sm" c="dimmed">
												{`on ${issue.pagesAffected} of ${currentPages} pages`}
											</Text>
										)}
									</Group>
									{/* The pages the finding is about — a shared
									    keyword, title or description. Opened directly,
									    because the analysis names them by URL before
									    any of them has an id. */}
									{issue.relatedUrls.length > 0 && (
										<Group gap={6} wrap="wrap">
											{issue.relatedUrls.map((url) => (
												<Anchor
													key={url}
													href={url}
													target="_blank"
													rel="noreferrer"
													size="sm"
												>
													{url}
												</Anchor>
											))}
										</Group>
									)}
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
