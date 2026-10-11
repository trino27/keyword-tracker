import {
	Box,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from "@mantine/core";
import {
	IconArrowsDiff,
	IconCircleCheck,
	IconCircleDashed,
	IconCircleMinus,
	IconCircleX,
} from "@tabler/icons-react";
import type { TCheckStatus, TChecksByOwner, TScoredIssueOwner } from "@app/contracts";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import {
	summariseChecks,
	type ICheckCell,
	type IChecksColumn,
	type IChecksContext,
} from "@ViewModels/PageDetailViewModel/Services/SummariseChecks/summariseChecks";

const MARKER: Record<TCheckStatus, { color: string; icon: React.ReactNode }> = {
	passed: { color: "teal", icon: <IconCircleCheck size={14} /> },
	failed: { color: "red", icon: <IconCircleX size={14} /> },
	notApplicable: { color: "gray", icon: <IconCircleMinus size={14} /> },
	notYetChecked: { color: "gray", icon: <IconCircleDashed size={14} /> },
};

const OWNERS: TScoredIssueOwner[] = ["crawl", "lighthouse"];

const DISAGREE =
	"Our check and Lighthouse's disagree. They can: Lighthouse runs the page's scripts in a " +
	"browser, while our crawl reads the HTML the server sends, and the two looked at the page " +
	"at different times.";

interface IChecksSectionProps {
	checksByOwner: TChecksByOwner;
	context: IChecksContext;
	timeZone: string;
}

/**
 * Every check of both owners — ours and Lighthouse's — and what each last concluded: the
 * score's denominator as a list rather than a number (PAGEDETAIL-009).
 *
 * Two columns, so a check both of us judge reads on one line: a client quoting
 * Lighthouse can see whether we agree. A failed cell carries its label and nothing else
 * on purpose: the hint and the count of sibling pages live in SEO issues below, where
 * the severity ordering puts the worst first, and the closing line says where to go.
 */
export function ChecksSection({ checksByOwner, context, timeZone }: IChecksSectionProps) {
	const { columns, sections, failed } = summariseChecks(checksByOwner, context);
	return (
		<Stack gap="sm">
			<Title order={4}>Checks</Title>
			<Paper withBorder radius="md" p="md">
				<Stack gap="md">
					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
						{OWNERS.map((owner) => (
							<ColumnHeader key={owner} column={columns[owner]} timeZone={timeZone} />
						))}
					</SimpleGrid>
					{sections.map((section) => (
						<Stack key={section.heading} gap="xs">
							<Divider
								label={
									<Group gap={6} wrap="nowrap">
										<Text size="sm" fw={600}>
											{section.heading}
										</Text>
										{section.failed > 0 && (
											<Text size="xs" c="red">
												{`${section.failed} failed`}
											</Text>
										)}
									</Group>
								}
								labelPosition="left"
							/>
							{section.rows.map((row) => (
								<SimpleGrid
									key={row.key}
									cols={{ base: 1, sm: 2 }}
									spacing="md"
									verticalSpacing={4}
									data-disagree={row.disagree || undefined}
								>
									{OWNERS.map((owner) => (
										<Cell
											key={owner}
											title={columns[owner].title}
											cells={row.cells[owner]}
											disagree={owner === "lighthouse" && row.disagree}
										/>
									))}
								</SimpleGrid>
							))}
						</Stack>
					))}
					{failed > 0 && (
						<Text size="xs" c="dimmed">
							{`Details for the ${failed} failed check${failed === 1 ? "" : "s"} are in SEO issues below.`}
						</Text>
					)}
				</Stack>
			</Paper>
		</Stack>
	);
}

/** The column's name, the day its owner judged the page, and what it judged — or why nothing. */
function ColumnHeader({ column, timeZone }: { column: IChecksColumn; timeZone: string }) {
	return (
		<Stack gap={2}>
			<Group gap="xs" align="baseline">
				<Text fw={600}>{column.title}</Text>
				{column.judgedAt && (
					<Text size="xs" c="dimmed">
						{formatInZone(column.judgedAt, timeZone)}
					</Text>
				)}
			</Group>
			{column.empty ? (
				// One line for the whole column: inventing a cell per check would credit the
				// page for verdicts nobody reached.
				<Text size="sm">{column.empty}</Text>
			) : (
				<Text size="sm" c="dimmed" className="tabular">
					{`${column.title}: ${column.subtitle}`}
				</Text>
			)}
		</Stack>
	);
}

/**
 * One owner's codes on a row. On a narrow screen the two cells stack, so each says whose
 * it is; side by side, the column header already does.
 */
function Cell({
	title,
	cells,
	disagree,
}: {
	title: string;
	cells: ICheckCell[];
	disagree: boolean;
}) {
	if (cells.length === 0) return <Box visibleFrom="sm" />;
	return (
		<Stack gap={4}>
			<Text size="xs" c="dimmed" hiddenFrom="sm">
				{title}
			</Text>
			{cells.map((cell) => (
				<Group key={cell.code} gap="xs" align="flex-start" wrap="nowrap">
					<ThemeIcon
						color={MARKER[cell.status].color}
						variant="light"
						size="sm"
						radius="xl"
					>
						{MARKER[cell.status].icon}
					</ThemeIcon>
					<Stack gap={0}>
						<Text size="sm" data-status={cell.status}>
							{cell.label}
						</Text>
						{cell.reason && (
							<Text size="xs" c="dimmed">
								{cell.reason}
							</Text>
						)}
					</Stack>
				</Group>
			))}
			{disagree && (
				<Tooltip label={DISAGREE} withArrow multiline maw={320}>
					<Group gap={4} wrap="nowrap" w="fit-content">
						<IconArrowsDiff
							size={14}
							color="var(--mantine-color-yellow-7)"
							aria-hidden
						/>
						<Text size="xs" c="yellow.8">
							Sources disagree
						</Text>
					</Group>
				</Tooltip>
			)}
		</Stack>
	);
}
