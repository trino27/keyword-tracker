import { Badge, Code, Group, Skeleton, Stack, Table, Text } from "@mantine/core";
import { useEffect } from "react";
import { crawlItemStatusColor, crawlItemStatusLabel } from "@Core/Constants/crawlStatusColor";
import { AnchorLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import styles from "./RunLog.module.scss";

interface IRunLogProps {
	runId: number;
}

/**
 * Every sitemap entry the run considered, in sitemap order, with what happened to it —
 * the evidence for "the first 15 posts in sitemap order" and for every skip.
 */
export function RunLog({ runId }: IRunLogProps) {
	const entry = useClientsViewModel((state) => state.runLogs[runId]);
	const fetchRunLog = useClientsViewModel((state) => state.fetchRunLog);

	useEffect(() => {
		void fetchRunLog(runId);
	}, [runId, fetchRunLog]);

	if (!entry || (entry.status === "loading" && !entry.run)) {
		return (
			<Stack gap="xs" p="md">
				<Skeleton height={14} width="60%" />
				<Skeleton height={120} />
			</Stack>
		);
	}
	if (entry.status === "error" || !entry.run) {
		return (
			<SectionError
				title="Could not load the run log"
				message={entry.error ?? "Unknown error"}
				onRetry={() => void fetchRunLog(runId)}
			/>
		);
	}

	const { run } = entry;
	return (
		<Stack gap="sm" p="md" className={styles.log}>
			{run.sitemapUrl && (
				<Text size="sm">
					Blog sitemap: <Code>{run.sitemapUrl}</Code> · {run.pagesFound} entries
				</Text>
			)}
			{run.selectionReason && (
				<Text size="xs" c="dimmed">
					{run.selectionReason}
				</Text>
			)}
			{run.items.length === 0 ? (
				<Text size="sm" c="dimmed">
					No sitemap entry was considered
					{run.errorMessage ? `: ${run.errorMessage}` : "."}
				</Text>
			) : (
				<Table.ScrollContainer minWidth={640}>
					<Table striped withTableBorder fz="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th w={48}>#</Table.Th>
								<Table.Th>Sitemap entry</Table.Th>
								<Table.Th w={190}>Result</Table.Th>
								<Table.Th>Why</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{run.items.map((item) => (
								<Table.Tr key={item.sitemapPosition}>
									<Table.Td className="tabular">
										{item.sitemapPosition + 1}
									</Table.Td>
									<Table.Td className={styles.url}>
										{item.pageId ? (
											<AnchorLink
												to="/pages/$pageId"
												params={{ pageId: String(item.pageId) }}
												size="sm"
											>
												{item.url}
											</AnchorLink>
										) : (
											item.url
										)}
									</Table.Td>
									<Table.Td>
										<Badge
											color={crawlItemStatusColor[item.status]}
											variant="light"
										>
											{crawlItemStatusLabel[item.status]}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Group gap={6} wrap="nowrap">
											<Text size="sm" c={item.reason ? undefined : "dimmed"}>
												{item.reason ?? "—"}
											</Text>
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			)}
		</Stack>
	);
}
