import { Badge, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { severityLabel } from "@Core/Constants/severityLabel";
import { issueCopyOf } from "@Core/Helpers/IssueCopy/issueCopy";
import type {
	IClientRowsView,
	IIssueCardView,
} from "@ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue";
import { IssueLocation } from "../IssueLocation/IssueLocation";
import { TechnicalDetails } from "../TechnicalDetails/TechnicalDetails";

const SHOWN_ROWS = 8;

/** Where a problem was found: its rows, capped so a card stays a card. */
function Locations({ rows, more }: { rows: IClientRowsView["rows"]; more: string }) {
	return (
		<Stack gap="xs">
			{rows.slice(0, SHOWN_ROWS).map((row, index) => (
				// Index as key: rows of one code are unique by location, and a key built
				// from it would differ only in its kind for site rows.
				<IssueLocation key={index} row={row} />
			))}
			{rows.length > SHOWN_ROWS && (
				<Text size="xs" c="dimmed">
					…and {rows.length - SHOWN_ROWS} more {more}. Switch to "By page" or search to
					see them.
				</Text>
			)}
		</Stack>
	);
}

/**
 * One problem, explained once: what is wrong, why it matters, what to do and who does it,
 * then every page it was found on. The technical account stays folded.
 */
export function IssueCard({ card }: { card: IIssueCardView }) {
	const copy = issueCopyOf(card.code);
	const level = severityLabel[card.severity];
	const scope =
		card.wholeSite && card.rows.length === 1
			? "Whole site"
			: `affects ${card.affectedPages} page${card.affectedPages === 1 ? "" : "s"}`;
	return (
		<Paper withBorder radius="md" p="md">
			<Stack gap="sm">
				<Group justify="space-between" align="flex-start" wrap="nowrap">
					<Text fw={600}>{copy.plain.what}</Text>
					<Group gap={6} wrap="nowrap">
						<Badge color={level.color} variant="light">
							{level.label}
						</Badge>
						<Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
							{scope}
						</Text>
					</Group>
				</Group>
				<Stack gap={2}>
					<Text size="xs" c="dimmed" fw={600} tt="uppercase">
						Why it matters
					</Text>
					<Text size="sm">{copy.plain.why}</Text>
				</Stack>
				{copy.plain.fix && (
					<Stack gap={2}>
						<Text size="xs" c="dimmed" fw={600} tt="uppercase">
							What to do
						</Text>
						<Text size="sm">{copy.plain.fix}</Text>
					</Stack>
				)}
				<TechnicalDetails copy={copy} />
				<Divider />
				{card.clients.some(({ client }) => client !== null) ? (
					// Several clients: each one's pages under its name (plan D34).
					<Stack gap="md">
						{card.clients.map(({ client, rows }) => (
							<Stack
								key={client?.id ?? 0}
								gap="xs"
								role="group"
								aria-label={client?.name}
							>
								<Group gap={6}>
									<Text size="sm" fw={700}>
										{client?.name}
									</Text>
									<Text size="xs" c="dimmed">
										{client?.site}
									</Text>
								</Group>
								<Locations
									rows={rows}
									more={`pages on ${client?.name ?? "this site"}`}
								/>
							</Stack>
						))}
					</Stack>
				) : (
					<Locations rows={card.rows} more="pages" />
				)}
			</Stack>
		</Paper>
	);
}
