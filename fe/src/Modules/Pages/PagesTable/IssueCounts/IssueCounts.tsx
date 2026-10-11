import { Badge, Group, Text, Tooltip } from "@mantine/core";
import { SEO_ISSUE_SEVERITIES } from "@app/contracts";
import { severityLabel } from "@Core/Constants/severityLabel";
import type { TPageListItem } from "@Gateways/PageGateway/Validation/PageSchemas";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";

const countOf = (count: number, severity: keyof typeof severityLabel) =>
	`${count} ${count === 1 ? severityLabel[severity].label : severityLabel[severity].plural}`;

/**
 * One row's issues, by level: the level's icon and a count, its name on hover — and a link
 * into the report filtered to this page, where each one is explained (plan D18, D28).
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
			// The report's defaults show every level, so the count it links from — Improvements
			// included — is what it opens on.
			search={{ clientId: item.client.id, pageId: item.id }}
			underline="never"
			aria-label={`See this page's ${issues.total} issues`}
		>
			<Group gap={4} wrap="nowrap">
				{SEO_ISSUE_SEVERITIES.filter((severity) => issues[severity] > 0).map((severity) => {
					const { color, icon: Icon } = severityLabel[severity];
					const name = countOf(issues[severity], severity);
					return (
						<Tooltip key={severity} label={name} withArrow>
							<Badge
								color={color}
								variant="light"
								size="sm"
								className="tabular"
								leftSection={<Icon size={12} />}
								aria-label={name}
							>
								{issues[severity]}
							</Badge>
						</Tooltip>
					);
				})}
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
