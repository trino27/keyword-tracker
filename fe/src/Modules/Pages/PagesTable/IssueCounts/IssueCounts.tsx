import { Badge, Group, Text } from "@mantine/core";
import { severityLabel } from "@Core/Constants/severityLabel";
import type { TPageListItem } from "@Gateways/PageGateway/Validation/PageSchemas";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";

const countOf = (count: number, severity: keyof typeof severityLabel) =>
	`${count} ${count === 1 ? severityLabel[severity].label : severityLabel[severity].plural}`;

/**
 * One row's issues, by level, in the report's words — and a link into the report filtered
 * to this page, where each one is explained (plan D18, D28).
 */
export function IssueCounts({ item }: { item: TPageListItem }) {
	const { issues } = item;
	if (issues.total === 0) {
		return (
			<Text size="sm" c="dimmed">
				None
			</Text>
		);
	}
	return (
		<AnchorLink
			to="/issues"
			// Every level: the count it links from includes Improvements, which the report
			// hides by default; a row reading "2 Improvements" must not open an empty page.
			search={{
				clientId: item.client.id,
				pageId: item.id,
				levels: ["error", "warning", "notice"],
			}}
			underline="never"
			aria-label={`See this page's ${issues.total} issues`}
		>
			<Group gap={4} wrap="nowrap">
				{issues.error > 0 && (
					<Badge color={severityLabel.error.color} variant="light" size="sm">
						{countOf(issues.error, "error")}
					</Badge>
				)}
				{issues.warning > 0 && (
					<Badge color={severityLabel.warning.color} variant="light" size="sm">
						{countOf(issues.warning, "warning")}
					</Badge>
				)}
				{issues.notice > 0 && (
					<Badge color={severityLabel.notice.color} variant="light" size="sm">
						{countOf(issues.notice, "notice")}
					</Badge>
				)}
				{/* A number on every row of a client says the fix is in the template. */}
				{issues.siteWide > 0 && (
					<Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
						{`${issues.siteWide} site-wide`}
					</Text>
				)}
			</Group>
		</AnchorLink>
	);
}
