import { Button, Skeleton, Stack, Text } from "@mantine/core";
import { IconCircleCheck, IconFilterOff } from "@tabler/icons-react";
import { useMemo } from "react";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import {
	type IClientReport,
	PENDING_REPORT,
} from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { filterReport } from "@ViewModels/IssueReportViewModel/Services/FilterReport/filterReport";
import {
	groupByIssueAcrossClients,
	type IReportClient,
} from "@ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue";
import { IssuesByIssue } from "../IssuesByIssue/IssuesByIssue";

interface IAllClientsByIssueProps {
	/** Every client of the user, by name. */
	clients: IReportClient[];
	byClient: Record<number, IClientReport>;
	search: TIssuesSearch;
	onRetry: (clientId: number) => void;
	onClearFilters: () => void;
}

const names = (clients: IReportClient[]) => clients.map(({ name }) => name).join(", ");

/** A finished crawl's report is there: its rows can be listed. */
const isCrawled = ({ entry }: { entry: IClientReport }) =>
	entry.status === "ready" && Boolean(entry.report?.generatedFrom);

/**
 * "All clients" by issue (plan D34): one list of problems for every client, worst and
 * widest first, each card grouping the pages it was found on by client. A client whose
 * report is not there — loading, failed, never crawled — is named once above the list.
 */
export function AllClientsByIssue({
	clients,
	byClient,
	search,
	onRetry,
	onClearFilters,
}: IAllClientsByIssueProps) {
	const states = useMemo(
		() =>
			clients.map((client) => {
				const entry = byClient[client.id] ?? PENDING_REPORT;
				const issues =
					entry.status === "ready" && entry.report
						? filterReport(entry.report.issues, {
								levels: search.levels,
								type: search.type,
								pageId: search.pageId,
								query: search.q,
							})
						: [];
				return { client, entry, issues };
			}),
		[clients, byClient, search.levels, search.type, search.pageId, search.q],
	);

	const ready = states.filter(isCrawled);
	const loading = states.filter(({ entry }) => entry.status === "loading");
	const failed = states.filter(({ entry }) => entry.status === "error");
	const notCrawled = states.filter(
		({ entry }) =>
			entry.status === "notFound" ||
			(entry.status === "ready" && !entry.report?.generatedFrom),
	);
	const clean = ready.filter(({ entry }) => entry.report?.issues.length === 0);

	const groups = useMemo(
		() =>
			groupByIssueAcrossClients(
				states.filter(isCrawled).map(({ client, entry, issues }) => ({
					client,
					issues,
					currentPages: entry.report?.currentPages ?? 0,
				})),
			),
		[states],
	);

	if (ready.length === 0 && loading.length > 0)
		return (
			<Stack gap="sm" aria-busy="true" aria-label="Loading issues">
				{[0, 1, 2].map((row) => (
					<Skeleton key={row} height={120} radius="md" />
				))}
			</Stack>
		);

	const anyIssues = ready.some(({ entry }) => (entry.report?.issues.length ?? 0) > 0);

	return (
		<Stack gap="md">
			{failed.map(({ client, entry }) => (
				<SectionError
					key={client.id}
					title={`Could not load ${client.name}`}
					message={entry.error ?? "Could not load the report."}
					onRetry={() => onRetry(client.id)}
				/>
			))}
			{loading.length > 0 && (
				<Text size="sm" c="dimmed" aria-busy="true">
					Still loading: {names(loading.map(({ client }) => client))}.
				</Text>
			)}
			{notCrawled.length > 0 && (
				<Text size="sm" c="dimmed">
					No finished crawl yet: {names(notCrawled.map(({ client }) => client))}.
				</Text>
			)}
			{clean.length > 0 && anyIssues && (
				<Text size="sm" c="dimmed">
					No issues on the latest crawl: {names(clean.map(({ client }) => client))}.
				</Text>
			)}
			{groups.length > 0 ? (
				<IssuesByIssue groups={groups} />
			) : anyIssues ? (
				<EmptyState
					icon={<IconFilterOff size={22} />}
					title="No issues match these filters"
					action={
						<Button variant="light" onClick={onClearFilters}>
							Clear filters
						</Button>
					}
				/>
			) : (
				ready.length > 0 && (
					<EmptyState
						icon={<IconCircleCheck size={22} />}
						title="No issues on the latest crawls"
					/>
				)
			)}
		</Stack>
	);
}
