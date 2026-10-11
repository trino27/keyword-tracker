import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import { SEO_ISSUE_SEVERITIES } from "@app/contracts";
import { severityLabel } from "@Core/Constants/severityLabel";
import { issueCopyOf } from "@Core/Helpers/IssueCopy/issueCopy";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { groupByPage } from "@ViewModels/IssueReportViewModel/Services/GroupByPage/groupByPage";
import { IssueLocation } from "../IssueLocation/IssueLocation";
import { TechnicalDetails } from "../TechnicalDetails/TechnicalDetails";

/** A condensed card: what, the level, the finding's own sentence, the fix. */
function CompactIssue({ row }: { row: TReportIssue }) {
	const copy = issueCopyOf(row.code);
	const level = severityLabel[row.severity];
	return (
		<Stack gap={4}>
			<Group gap="xs" wrap="nowrap" align="flex-start">
				<Badge color={level.color} variant="light" size="sm">
					{level.label}
				</Badge>
				<Text size="sm" fw={600}>
					{copy.plain.what}
				</Text>
			</Group>
			<IssueLocation row={row} withPage={false} />
			{copy.plain.fix && <Text size="sm">{copy.plain.fix}</Text>}
			<TechnicalDetails copy={copy} />
		</Stack>
	);
}

/** "By page": the whole site first, then each page, the one with most Critical first. */
export function IssuesByPage({ issues }: { issues: TReportIssue[] }) {
	const view = groupByPage(issues);
	return (
		<Stack gap="md">
			{view.wholeSite.length > 0 && (
				<Paper withBorder radius="md" p="md">
					<Stack gap="sm">
						<Text fw={700}>Whole site</Text>
						{view.wholeSite.map((row, index) => (
							<CompactIssue key={`${row.code}-${index}`} row={row} />
						))}
					</Stack>
				</Paper>
			)}
			{view.pages.map((group) => (
				<Paper key={group.page.id} withBorder radius="md" p="md">
					<Stack gap="sm">
						<Group justify="space-between" wrap="nowrap">
							<Stack gap={0} style={{ minWidth: 0 }}>
								<AnchorLink
									to="/pages/$pageId"
									params={{ pageId: String(group.page.id) }}
									fw={600}
									lineClamp={1}
								>
									{group.page.title ?? group.page.url}
								</AnchorLink>
								<Text size="xs" c="dimmed" truncate="end">
									{group.page.url}
								</Text>
							</Stack>
							<Group gap={4} wrap="nowrap">
								{SEO_ISSUE_SEVERITIES.filter(
									(severity) => group.counts[severity] > 0,
								).map((severity) => (
									<Badge
										key={severity}
										color={severityLabel[severity].color}
										variant="light"
										size="sm"
									>
										{group.counts[severity]} {severityLabel[severity].label}
									</Badge>
								))}
							</Group>
						</Group>
						{group.rows.map((row) => (
							<CompactIssue key={row.code} row={row} />
						))}
					</Stack>
				</Paper>
			))}
		</Stack>
	);
}
