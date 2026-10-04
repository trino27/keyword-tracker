import { Badge, Group, Text } from "@mantine/core";
import type { TPageListItem } from "@Gateways/PageGateway/Validation/PageSchemas";

/** One row's SEO issues, by severity. */
export function IssueCounts({ issues }: { issues: TPageListItem["issues"] }) {
	if (issues.total === 0) {
		return (
			<Text size="sm" c="dimmed">
				None
			</Text>
		);
	}
	return (
		<Group gap={4} wrap="nowrap">
			{issues.error > 0 && (
				<Badge color="red" variant="light" size="sm">
					{issues.error} error{issues.error === 1 ? "" : "s"}
				</Badge>
			)}
			{issues.warning > 0 && (
				<Badge color="yellow" variant="light" size="sm">
					{issues.warning} warning{issues.warning === 1 ? "" : "s"}
				</Badge>
			)}
			{issues.notice > 0 && (
				<Badge color="gray" variant="light" size="sm">
					{issues.notice}
				</Badge>
			)}
			{/* A number on every row of a client says the fix is in the template. */}
			{issues.siteWide > 0 && (
				<Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
					{`${issues.siteWide} site-wide`}
				</Text>
			)}
		</Group>
	);
}
