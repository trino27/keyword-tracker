import {
	ActionIcon,
	Anchor,
	Button,
	Collapse,
	Group,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	Tooltip,
} from "@mantine/core";
import {
	IconBuildingStore,
	IconChevronDown,
	IconChevronRight,
	IconRefresh,
} from "@tabler/icons-react";
import { Fragment } from "react";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import { CrawlStatusBadge } from "@Modules/_Shared/CrawlStatusBadge/CrawlStatusBadge";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { ButtonLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { isClientCrawling } from "@ViewModels/ClientsViewModel/Services/HasActiveRun/hasActiveRun";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { RunLog } from "../RunLog/RunLog";

interface IClientsTableProps {
	expandedClientId: number | undefined;
	onToggle: (clientId: number) => void;
}

export function ClientsTable({ expandedClientId, onToggle }: IClientsTableProps) {
	const clients = useClientsViewModel((state) => state.clients);
	const status = useClientsViewModel((state) => state.status);
	const error = useClientsViewModel((state) => state.error);
	const rowErrors = useClientsViewModel((state) => state.rowErrors);
	const fetchClients = useClientsViewModel((state) => state.fetchClients);
	const recrawl = useClientsViewModel((state) => state.recrawl);
	const timeZone = useSessionViewModel((state) => state.user?.timeZone ?? "UTC");

	if (status === "error" && error) {
		return <SectionError message={error} onRetry={() => void fetchClients()} />;
	}
	if (status !== "ready" && clients.length === 0) {
		return (
			<Paper withBorder radius="md" p="md">
				<Stack gap="sm">
					{[0, 1, 2].map((row) => (
						<Skeleton key={row} height={36} />
					))}
				</Stack>
			</Paper>
		);
	}
	if (clients.length === 0) {
		return (
			<EmptyState
				icon={<IconBuildingStore size={22} />}
				title="No clients yet"
				description="Add one above: its blog posts appear on the pages list once the crawl finishes."
			/>
		);
	}

	return (
		<Paper withBorder radius="md">
			<Table.ScrollContainer minWidth={760}>
				<Table highlightOnHover>
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={36} />
							<Table.Th>Client</Table.Th>
							<Table.Th ta="right">Pages</Table.Th>
							<Table.Th>Latest crawl</Table.Th>
							<Table.Th ta="right">Actions</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{clients.map((client) => {
							const run = client.latestRun;
							const crawling = isClientCrawling(client);
							const expanded = expandedClientId === client.id;
							return (
								<Fragment key={client.id}>
									<Table.Tr>
										<Table.Td>
											<ActionIcon
												variant="subtle"
												color="gray"
												onClick={() => onToggle(client.id)}
												disabled={!run}
												aria-label={
													expanded ? "Hide run log" : "Show run log"
												}
												aria-expanded={expanded}
											>
												{expanded ? (
													<IconChevronDown size={16} />
												) : (
													<IconChevronRight size={16} />
												)}
											</ActionIcon>
										</Table.Td>
										<Table.Td>
											<Text fw={600} size="sm">
												{client.name}
											</Text>
											<Anchor
												href={client.websiteUrl}
												target="_blank"
												rel="noreferrer"
												size="xs"
											>
												{client.siteKey}
											</Anchor>
										</Table.Td>
										<Table.Td ta="right" className="tabular">
											{client.currentPageCount}
										</Table.Td>
										<Table.Td>
											<Group gap="xs" wrap="nowrap">
												<CrawlStatusBadge status={run?.status ?? null} />
												{run && (
													<Text size="xs" c="dimmed">
														{crawling
															? `${run.pagesDone} of 15 pages`
															: formatInZone(
																	run.finishedAt ?? run.createdAt,
																	timeZone,
																	"dateTime",
																)}
													</Text>
												)}
											</Group>
											{rowErrors[client.id] && (
												<Text size="xs" c="red" mt={4}>
													{rowErrors[client.id]}
												</Text>
											)}
										</Table.Td>
										<Table.Td>
											<Group gap="xs" justify="flex-end" wrap="nowrap">
												<ButtonLink
													to="/pages"
													search={{ clientId: client.id }}
													size="xs"
													variant="light"
												>
													View pages
												</ButtonLink>
												<Tooltip
													label="A crawl is already running"
													disabled={!crawling}
													withArrow
												>
													<Button
														size="xs"
														variant="default"
														leftSection={<IconRefresh size={14} />}
														disabled={crawling}
														onClick={() => void recrawl(client.id)}
													>
														Re-crawl
													</Button>
												</Tooltip>
											</Group>
										</Table.Td>
									</Table.Tr>
									{run && (
										<Table.Tr>
											<Table.Td
												colSpan={5}
												p={0}
												style={{ borderTop: expanded ? undefined : 0 }}
											>
												<Collapse expanded={expanded}>
													{expanded && <RunLog runId={run.id} />}
												</Collapse>
											</Table.Td>
										</Table.Tr>
									)}
								</Fragment>
							);
						})}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Paper>
	);
}
