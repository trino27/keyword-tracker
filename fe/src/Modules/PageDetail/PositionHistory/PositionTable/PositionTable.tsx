import { Group, Paper, Table, Text } from "@mantine/core";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { PositionBadge } from "@Modules/_Shared/PositionBadge/PositionBadge";
import { buildHistoryTable } from "@ViewModels/PageDetailViewModel/Services/BuildHistoryTable/buildHistoryTable";

/** Gained places are good news: green and up, even though the number went down. */
function Change({ value }: { value: number | null }) {
	if (value === null) return <Text c="dimmed">—</Text>;
	if (value === 0)
		return (
			<Group gap={2} c="dimmed" wrap="nowrap">
				<IconMinus size={14} />
				<Text span size="sm">
					0
				</Text>
			</Group>
		);
	const better = value > 0;
	return (
		<Group
			gap={2}
			c={better ? "teal" : "red"}
			wrap="nowrap"
			aria-label={better ? `up ${value}` : `down ${-value}`}
		>
			{better ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
			<Text span size="sm" fw={600} className="tabular">
				{Math.abs(value)}
			</Text>
		</Group>
	);
}

export function PositionTable({ history }: { history: TPositionHistory }) {
	const rows = buildHistoryTable(history);
	return (
		<Paper withBorder radius="md">
			<Table.ScrollContainer minWidth={560}>
				<Table striped>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Keyword</Table.Th>
							<Table.Th>Latest</Table.Th>
							<Table.Th>Change</Table.Th>
							<Table.Th>Best</Table.Th>
							<Table.Th>Worst</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{rows.map((row) => (
							<Table.Tr key={row.keywordId}>
								<Table.Td>
									<Text size="sm" fw={500}>
										{row.term}
									</Text>
								</Table.Td>
								<Table.Td>
									<PositionBadge position={row.latest} size="sm" />
								</Table.Td>
								<Table.Td>
									<Change value={row.change} />
								</Table.Td>
								<Table.Td className="tabular">{row.best ?? "—"}</Table.Td>
								<Table.Td className="tabular">{row.worst ?? "—"}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Paper>
	);
}
