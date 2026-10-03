import { Badge, Button, Group, Paper, Skeleton, Stack, Table, Text, Tooltip } from "@mantine/core";
import {
	IconBuildingStore,
	IconFileSearch,
	IconHourglass,
	IconSearchOff,
} from "@tabler/icons-react";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import type { TPageListItem } from "@Gateways/PageGateway/Validation/PageSchemas";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { PositionBadge } from "@Modules/_Shared/PositionBadge/PositionBadge";
import { ScoreBadge } from "@Modules/_Shared/ScoreBadge/ScoreBadge";
import { AnchorLink, ButtonLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import type { TLoadStatus } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import type { TEmptyKind } from "@ViewModels/PagesViewModel/Services/ToEmptyKind/toEmptyKind";
import styles from "./PagesTable.module.scss";

const SHOWN_KEYWORDS = 3;

interface IPagesTableProps {
	items: TPageListItem[];
	status: TLoadStatus;
	error: string | null;
	emptyKind: TEmptyKind | null;
	timeZone: string;
	/** Hide the client column when the list is already filtered to one client. */
	showClient: boolean;
	onRetry: () => void;
	onClearSearch: () => void;
}

function IssueCounts({ issues }: { issues: TPageListItem["issues"] }) {
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
		</Group>
	);
}

function EmptyList({ kind, onClearSearch }: { kind: TEmptyKind; onClearSearch: () => void }) {
	switch (kind) {
		case "noClients":
			return (
				<EmptyState
					icon={<IconBuildingStore size={22} />}
					title="No clients yet"
					description="Add a client: we find its blog, crawl the first 15 posts and extract their keywords."
					action={
						<ButtonLink to="/clients" mt="xs">
							Add a client
						</ButtonLink>
					}
				/>
			);
		case "noMatches":
			return (
				<EmptyState
					icon={<IconSearchOff size={22} />}
					title="No pages match this search"
					description="The search looks at page URLs and keywords."
					action={
						<Button variant="light" mt="xs" onClick={onClearSearch}>
							Clear the search
						</Button>
					}
				/>
			);
		case "noPagesYet":
			return (
				<EmptyState
					icon={<IconHourglass size={22} />}
					title="This client has no pages yet"
					description="Its posts appear here when a crawl finishes; the banner above shows where it is."
				/>
			);
		case "noPages":
			return (
				<EmptyState
					icon={<IconFileSearch size={22} />}
					title="No crawled pages yet"
					description="Crawls run in the background; pages appear as each one finishes."
				/>
			);
	}
}

export function PagesTable({
	items,
	status,
	error,
	emptyKind,
	timeZone,
	showClient,
	onRetry,
	onClearSearch,
}: IPagesTableProps) {
	if (status === "error" && error) return <SectionError message={error} onRetry={onRetry} />;
	if (status !== "ready" && items.length === 0) {
		return (
			<Paper withBorder radius="md" p="md" aria-busy="true" aria-label="Loading pages">
				<Stack gap="sm">
					{[0, 1, 2, 3, 4].map((row) => (
						<Skeleton key={row} height={40} />
					))}
				</Stack>
			</Paper>
		);
	}
	if (emptyKind) return <EmptyList kind={emptyKind} onClearSearch={onClearSearch} />;

	return (
		<Paper withBorder radius="md" className={status === "loading" ? styles.stale : undefined}>
			<Table.ScrollContainer minWidth={900}>
				<Table highlightOnHover verticalSpacing="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Page</Table.Th>
							<Table.Th>Score</Table.Th>
							{showClient && <Table.Th>Client</Table.Th>}
							<Table.Th>Keywords</Table.Th>
							<Table.Th>Best position</Table.Th>
							<Table.Th>SEO issues</Table.Th>
							<Table.Th>Updated</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{items.map((item) => (
							<Table.Tr key={item.id}>
								<Table.Td className={styles.pageCell}>
									<AnchorLink
										to="/pages/$pageId"
										params={{ pageId: String(item.id) }}
										fw={600}
										size="sm"
										lineClamp={2}
									>
										{item.title ?? item.url}
									</AnchorLink>
									<Text size="xs" c="dimmed" truncate="end">
										{item.url}
									</Text>
								</Table.Td>
								<Table.Td>
									{/* The rows are rendered in the order the gateway returned
									    them — worst first. A second sort here could only
									    disagree with the one the database applied. */}
									<ScoreBadge score={item.score} withNote />
								</Table.Td>
								{showClient && (
									<Table.Td>
										<Text size="sm">{item.client.name}</Text>
									</Table.Td>
								)}
								<Table.Td className={styles.keywordsCell}>
									<Group gap={4}>
										{item.keywords.slice(0, SHOWN_KEYWORDS).map((keyword) => (
											<Badge
												key={keyword.keywordId}
												variant="default"
												size="sm"
												tt="none"
												rightSection={
													<Text
														span
														size="xs"
														c="dimmed"
														className="tabular"
													>
														{keyword.latestPosition === null
															? "—"
															: `#${keyword.latestPosition}`}
													</Text>
												}
											>
												{keyword.term}
											</Badge>
										))}
										{item.keywords.length > SHOWN_KEYWORDS && (
											<Tooltip
												label={item.keywords
													.slice(SHOWN_KEYWORDS)
													.map((keyword) => keyword.term)
													.join(", ")}
												withArrow
												multiline
												maw={280}
											>
												<Badge variant="transparent" size="sm" c="dimmed">
													+{item.keywords.length - SHOWN_KEYWORDS}
												</Badge>
											</Tooltip>
										)}
									</Group>
								</Table.Td>
								<Table.Td>
									<Group gap={6} wrap="nowrap">
										<PositionBadge
											position={item.bestPosition?.position ?? null}
										/>
										{item.bestPosition && (
											<Text size="xs" c="dimmed" truncate="end" maw={140}>
												{item.bestPosition.term}
											</Text>
										)}
									</Group>
								</Table.Td>
								<Table.Td>
									<IssueCounts issues={item.issues} />
								</Table.Td>
								<Table.Td>
									<Text size="sm" c="dimmed">
										{item.lastCapturedAt
											? formatInZone(item.lastCapturedAt, timeZone)
											: "—"}
									</Text>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Paper>
	);
}
