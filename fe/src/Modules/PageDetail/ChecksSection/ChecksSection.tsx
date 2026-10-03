import { Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import {
	IconCircleCheck,
	IconCircleDashed,
	IconCircleMinus,
	IconCircleX,
} from "@tabler/icons-react";
import type { TCheckStatus } from "@app/contracts";
import type { TPageCheck } from "@Gateways/PageGateway/Validation/PageSchemas";
import { summariseChecks } from "@ViewModels/PageDetailViewModel/Services/SummariseChecks/summariseChecks";

const MARKER: Record<TCheckStatus, { color: string; icon: React.ReactNode }> = {
	passed: { color: "teal", icon: <IconCircleCheck size={14} /> },
	failed: { color: "red", icon: <IconCircleX size={14} /> },
	notApplicable: { color: "gray", icon: <IconCircleMinus size={14} /> },
	notYetChecked: { color: "gray", icon: <IconCircleDashed size={14} /> },
};

/**
 * Every catalogue check and what the last crawl concluded — the score's denominator as a
 * list rather than a number.
 *
 * A failed row carries its label and nothing else on purpose: the measurement, the hint
 * and the count of sibling pages live in SEO issues below, where the severity ordering
 * puts the worst first. Repeating a label is cheaper than losing that order, so the two
 * sections overlap by exactly one word each and the closing line says where to go.
 */
export function ChecksSection({ checks }: { checks: TPageCheck[] | null }) {
	if (checks === null) {
		return (
			<Stack gap="sm">
				<Title order={4}>Checks</Title>
				<Paper withBorder radius="md" p="md">
					{/* No verdict was recorded for this crawl, and inventing one would credit
					    the page for checks that never ran. */}
					<Text size="sm">Re-crawl this page to see each check.</Text>
				</Paper>
			</Stack>
		);
	}

	const { rows, subtitle, failed } = summariseChecks(checks);
	return (
		<Stack gap="sm">
			<Group gap="sm" align="baseline">
				<Title order={4}>Checks</Title>
				<Text size="sm" c="dimmed" className="tabular">
					{subtitle}
				</Text>
			</Group>
			<Paper withBorder radius="md" p="md">
				<Stack gap="xs">
					{rows.map((row) => (
						<Group key={row.code} gap="xs" align="flex-start" wrap="nowrap">
							<ThemeIcon
								color={MARKER[row.status].color}
								variant="light"
								size="sm"
								radius="xl"
							>
								{MARKER[row.status].icon}
							</ThemeIcon>
							<Stack gap={0}>
								<Text size="sm" data-status={row.status}>
									{row.label}
								</Text>
								{row.reason && (
									<Text size="xs" c="dimmed">
										{row.reason}
									</Text>
								)}
							</Stack>
						</Group>
					))}
					{failed > 0 && (
						<Text size="xs" c="dimmed" pt="xs">
							{`Details for the ${failed} failed check${failed === 1 ? "" : "s"} are in SEO issues below.`}
						</Text>
					)}
				</Stack>
			</Paper>
		</Stack>
	);
}
