import { Anchor, Badge, Code, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { SITE_CHECK_CATALOGUE, type TSeoIssueSeverity } from "@app/contracts";
import type { TSiteCheckResult } from "@Gateways/ClientGateway/Validation/ClientSchemas";

const SEVERITY_COLOR: Record<TSeoIssueSeverity, string> = {
	error: "red",
	warning: "yellow",
	notice: "gray",
};

const evidenceOf = (check: TSiteCheckResult): string[] =>
	Array.isArray(check.details.evidence)
		? (check.details.evidence as unknown[]).filter(
				(quote): quote is string => typeof quote === "string",
			)
		: [];

/**
 * What this crawl concluded about the site as a whole — robots.txt, the sitemap, the
 * host, how a missing page answers. A failure shows what it found, what to do and why,
 * with the documentation behind it; passes and skips are listed by name, so a check
 * that was not run never reads as one that passed. None of it counts in a page's score.
 */
export function SiteChecks({ checks }: { checks: TSiteCheckResult[] }) {
	if (checks.length === 0) return null;
	const failed = checks.filter(({ status }) => status === "failed");
	const rest = checks.filter(({ status }) => status !== "failed");

	return (
		<Stack gap="xs">
			<Title order={5}>Site checks</Title>
			{failed.length === 0 && (
				<Text size="sm">Every site check that could be judged passed.</Text>
			)}
			{failed.map((check) => {
				const entry = SITE_CHECK_CATALOGUE[check.code];
				return (
					<Paper key={check.code} withBorder radius="md" p="sm">
						<Stack gap={4}>
							<Group gap="xs">
								<Badge
									color={SEVERITY_COLOR[check.severity]}
									variant="light"
									size="sm"
								>
									{check.severity}
								</Badge>
								<Text size="sm" fw={500}>
									{entry.label}
								</Text>
							</Group>
							{evidenceOf(check).length > 0 && (
								<Stack gap={2} aria-label="Evidence">
									{evidenceOf(check).map((quote) => (
										<Code
											key={quote}
											block
											style={{
												whiteSpace: "pre-wrap",
												wordBreak: "break-word",
											}}
										>
											{quote}
										</Code>
									))}
								</Stack>
							)}
							<Text size="sm">{entry.hint}</Text>
							<Text size="xs" c="dimmed">
								{entry.explanation}
							</Text>
							<Group gap={6} wrap="wrap">
								<Text size="xs" c="dimmed">
									Source:
								</Text>
								{entry.sources.map((source) => (
									<Anchor
										key={source.url}
										href={source.url}
										target="_blank"
										rel="noreferrer"
										size="xs"
									>
										{source.title}
									</Anchor>
								))}
							</Group>
						</Stack>
					</Paper>
				);
			})}
			{rest.length > 0 && (
				<Stack gap={2}>
					{rest.map((check) => (
						<Text key={check.code} size="xs" c="dimmed" data-status={check.status}>
							{check.status === "passed" ? "Passed" : "Not judged"}:{" "}
							{SITE_CHECK_CATALOGUE[check.code].label}
							{check.status === "notApplicable" &&
								` — ${SITE_CHECK_CATALOGUE[check.code].skipReason}`}
						</Text>
					))}
				</Stack>
			)}
		</Stack>
	);
}
