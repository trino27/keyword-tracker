import { Paper, Table, Text } from "@mantine/core";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { PositionBadge } from "@Modules/_Shared/PositionBadge/PositionBadge";
import { buildHistoryTable } from "@ViewModels/PageDetailViewModel/Services/BuildHistoryTable/buildHistoryTable";
import { PositionChange } from "./PositionChange/PositionChange";

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
									<PositionChange value={row.change} />
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
