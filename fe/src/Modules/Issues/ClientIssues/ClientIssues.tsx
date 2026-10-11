import { Anchor, Badge, Button, Group, Skeleton, Stack, Text, Title } from "@mantine/core";
import { IconCircleCheck, IconFilterOff, IconHourglass } from "@tabler/icons-react";
import { useMemo } from "react";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { NotFound } from "@Modules/_Shared/NotFound/NotFound";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import type { IClientReport } from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { filterReport } from "@ViewModels/IssueReportViewModel/Services/FilterReport/filterReport";
import {
	reportViewOf,
	type TReportView,
} from "@ViewModels/IssueReportViewModel/Services/ReportViewOf/reportViewOf";
import { IssuesByIssue } from "../IssuesByIssue/IssuesByIssue";
import { IssuesByPage } from "../IssuesByPage/IssuesByPage";

interface IClientIssuesProps {
	/** The client, its site and how to narrow the report to it: given, it is one section of "All clients". */
	section?: { name: string; site: string; onShowOnly: () => void };
	entry: IClientReport;
	search: TIssuesSearch;
	timeZone: string;
	/** The title of the page the report is filtered to, when it has rows of its own. */
	pageTitle: string | null;
	onRetry: () => void;
	onClearFilters: () => void;
}

/** One client's report: when it was crawled, then its rows grouped as chosen — or why there are none. */
export function ClientIssues({
	section,
	entry,
	search,
	timeZone,
	pageTitle,
	onRetry,
	onClearFilters,
}: IClientIssuesProps) {
	const { report } = entry;
	const filtered = useMemo(
		() =>
			report
				? filterReport(report.issues, {
						levels: search.levels,
						type: search.type,
						pageId: search.pageId,
						query: search.q,
					})
				: [],
		[report, search.levels, search.type, search.pageId, search.q],
	);
	// The clients list is already there: this decides only the report's own states.
	const view = reportViewOf({
		clientsStatus: "ready",
		clientCount: 1,
		clientsError: null,
		status: entry.status,
		error: entry.error,
		report,
		filtered,
	});

	const crawled = report?.generatedFrom && (
		<Text size="sm" c="dimmed">
			From the crawl that finished{" "}
			{formatInZone(report.generatedFrom.finishedAt, timeZone, "dateTime")}.
		</Text>
	);

	if (!section)
		return (
			<>
				{crawled}
				<FullView
					view={view}
					search={search}
					pageTitle={pageTitle}
					onRetry={onRetry}
					onClearFilters={onClearFilters}
				/>
			</>
		);

	return (
		<Stack gap="sm" component="section" aria-label={section.name}>
			<Stack gap={2}>
				<Group gap="xs">
					<Title order={3}>
						<Anchor
							component="button"
							type="button"
							inherit
							c="inherit"
							onClick={section.onShowOnly}
							title={`Only ${section.name}`}
						>
							{section.name}
						</Anchor>
					</Title>
					<Text size="sm" c="dimmed">
						{section.site}
					</Text>
					{view.kind === "ready" && (
						<Badge
							variant="light"
							color="gray"
							size="sm"
							aria-label={`${view.issues.length} ${view.issues.length === 1 ? "issue" : "issues"}`}
						>
							{view.issues.length}
						</Badge>
					)}
				</Group>
				{crawled}
			</Stack>
			<SectionView view={view} search={search} onRetry={onRetry} />
		</Stack>
	);
}

interface IViewProps {
	view: TReportView;
	search: TIssuesSearch;
	onRetry: () => void;
}

/** The rows, grouped as the reader chose. */
function Rows({
	view,
	search,
}: {
	view: Extract<TReportView, { kind: "ready" }>;
	search: TIssuesSearch;
}) {
	return search.group === "issue" ? (
		<IssuesByIssue issues={view.issues} currentPages={view.report.currentPages} />
	) : (
		<IssuesByPage issues={view.issues} />
	);
}

/** One client on the whole screen: every empty state says what to do next. */
function FullView({
	view,
	search,
	pageTitle,
	onRetry,
	onClearFilters,
}: IViewProps & { pageTitle: string | null; onClearFilters: () => void }) {
	switch (view.kind) {
		case "loading":
			return (
				<Stack gap="sm" aria-busy="true" aria-label="Loading issues">
					{[0, 1, 2].map((row) => (
						<Skeleton key={row} height={120} radius="md" />
					))}
				</Stack>
			);
		case "error":
			return <SectionError message={view.message} onRetry={onRetry} />;
		case "noClients":
		case "notFound":
			return <NotFound what="This client" />;
		case "noRun":
			return (
				<EmptyState
					icon={<IconHourglass size={22} />}
					title="No crawl of this client has finished yet"
					description="Issues appear here once its first crawl is done."
				/>
			);
		case "empty":
			return (
				<EmptyState
					icon={<IconCircleCheck size={22} />}
					title="No issues on the latest crawl"
				/>
			);
		case "filteredEmpty":
			return (
				<EmptyState
					icon={<IconFilterOff size={22} />}
					title="No issues match these filters"
					action={
						<Button variant="light" onClick={onClearFilters}>
							Clear filters
						</Button>
					}
				/>
			);
		case "ready":
			return (
				<>
					{search.pageId !== undefined && pageTitle === null && (
						<Text size="sm" c="dimmed">
							That page has no issues of its own here; the site-wide ones below still
							apply to it.
						</Text>
					)}
					<Rows view={view} search={search} />
				</>
			);
	}
}

/** One client among all: a short line instead of a full-screen empty state. */
function SectionView({ view, search, onRetry }: IViewProps) {
	switch (view.kind) {
		case "loading":
			return <Skeleton height={80} radius="md" aria-label="Loading issues" />;
		case "error":
			return <SectionError message={view.message} onRetry={onRetry} />;
		case "noClients":
		case "notFound":
			return (
				<Text size="sm" c="dimmed">
					This client is no longer available.
				</Text>
			);
		case "noRun":
			return (
				<Text size="sm" c="dimmed">
					No crawl of this client has finished yet.
				</Text>
			);
		case "empty":
			return (
				<Text size="sm" c="dimmed">
					No issues on the latest crawl.
				</Text>
			);
		case "filteredEmpty":
			return (
				<Text size="sm" c="dimmed">
					Nothing here matches these filters.
				</Text>
			);
		case "ready":
			return <Rows view={view} search={search} />;
	}
}
