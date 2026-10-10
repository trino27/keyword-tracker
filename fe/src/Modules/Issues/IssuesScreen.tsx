import { Alert, Button, Group, Select, Skeleton, Stack, Text } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
	IconBuildingStore,
	IconCircleCheck,
	IconFilterOff,
	IconHourglass,
	IconInfoCircle,
} from "@tabler/icons-react";
import { useEffect, useMemo } from "react";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import { pageSpeedAvailabilityCopy } from "@Core/Constants/pageSpeedAvailabilityCopy";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { NotFound } from "@Modules/_Shared/NotFound/NotFound";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";
import { ButtonLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { useIssueReportViewModel } from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { filterReport } from "@ViewModels/IssueReportViewModel/Services/FilterReport/filterReport";
import { reportViewOf } from "@ViewModels/IssueReportViewModel/Services/ReportViewOf/reportViewOf";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { IssueFilters } from "./IssueFilters/IssueFilters";
import { IssuesByIssue } from "./IssuesByIssue/IssuesByIssue";
import { IssuesByPage } from "./IssuesByPage/IssuesByPage";
import { SeverityRubric } from "./SeverityRubric/SeverityRubric";

/**
 * Every problem the tracker knows about one client's site, on one screen: what is wrong,
 * why it costs traffic, what to do and whom to ask — worst first, by problem or by page.
 * One read per client; every filter and grouping works on it in memory.
 */
export function IssuesScreen() {
	const search = useSearch({ from: "/app/issues" });
	const navigate = useNavigate({ from: "/issues" });
	const timeZone = useSessionViewModel((state) => state.user?.timeZone ?? "UTC");

	const clients = useClientsViewModel((state) => state.clients);
	const clientsStatus = useClientsViewModel((state) => state.status);
	const clientsError = useClientsViewModel((state) => state.error);
	const fetchClients = useClientsViewModel((state) => state.fetchClients);

	const vm = useIssueReportViewModel();
	const { fetchReport } = vm;

	const update = (change: Partial<TIssuesSearch>) =>
		void navigate({ search: (previous) => ({ ...previous, ...change }), replace: true });

	useEffect(() => {
		if (clientsStatus === "idle") void fetchClients();
	}, [clientsStatus, fetchClients]);

	// No client in the URL: the first by name, written into the URL so it can be shared.
	const firstClientId = useMemo(
		() => [...clients].sort((a, b) => a.name.localeCompare(b.name))[0]?.id,
		[clients],
	);
	useEffect(() => {
		if (search.clientId === undefined && firstClientId !== undefined)
			void navigate({
				search: (previous) => ({ ...previous, clientId: firstClientId }),
				replace: true,
			});
	}, [search.clientId, firstClientId, navigate]);

	useEffect(() => {
		if (search.clientId !== undefined) void fetchReport(search.clientId);
	}, [search.clientId, fetchReport]);

	const report = vm.clientId === search.clientId ? vm.report : null;
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
	const view = reportViewOf({
		clientsStatus,
		clientCount: clients.length,
		clientsError,
		status: vm.clientId === search.clientId ? vm.status : "loading",
		error: vm.error,
		report,
		filtered,
	});

	const pageTitle = useMemo(() => {
		for (const row of report?.issues ?? [])
			if (row.location.kind === "page" && row.location.page.id === search.pageId)
				return row.location.page.title ?? row.location.page.url;
		return null;
	}, [report, search.pageId]);

	const speedNotice = report
		? pageSpeedAvailabilityCopy[report.pageSpeedAvailability.state]
		: null;

	return (
		<Stack gap="md">
			<PageHeader
				title="Issues"
				description="Every problem found on a client's site, worst first, with why it matters and what to do."
				actions={
					<Select
						aria-label="Client"
						placeholder="Choose a client"
						data={clients.map((client) => ({
							value: String(client.id),
							label: client.name,
						}))}
						value={search.clientId === undefined ? null : String(search.clientId)}
						onChange={(value) =>
							value !== null &&
							update({ clientId: Number(value), pageId: undefined, q: undefined })
						}
						allowDeselect={false}
						w={240}
					/>
				}
			/>
			{report?.generatedFrom && (
				<Text size="sm" c="dimmed">
					From the crawl that finished{" "}
					{formatInZone(report.generatedFrom.finishedAt, timeZone, "dateTime")}.
				</Text>
			)}
			<SeverityRubric />
			{speedNotice ? (
				<Alert
					variant="light"
					color={speedNotice.color}
					icon={<IconInfoCircle size={18} />}
				>
					{speedNotice.notice}
				</Alert>
			) : (
				report && (
					<Text size="xs" c="dimmed">
						Speed figures are Google's mobile measurements; pages are re-measured at
						most once a day.
					</Text>
				)
			)}
			<IssueFilters search={search} pageTitle={pageTitle} onChange={update} />
			{view.kind === "loading" && (
				<Stack gap="sm" aria-busy="true" aria-label="Loading issues">
					{[0, 1, 2].map((row) => (
						<Skeleton key={row} height={120} radius="md" />
					))}
				</Stack>
			)}
			{view.kind === "error" && (
				<SectionError
					message={view.message}
					onRetry={() =>
						clientsStatus === "error"
							? void fetchClients()
							: search.clientId !== undefined && void fetchReport(search.clientId)
					}
				/>
			)}
			{view.kind === "noClients" && (
				<EmptyState
					icon={<IconBuildingStore size={22} />}
					title="Add a client to see its issues"
					action={
						<ButtonLink to="/clients" variant="light">
							Add client
						</ButtonLink>
					}
				/>
			)}
			{view.kind === "notFound" && <NotFound what="This client" />}
			{view.kind === "noRun" && (
				<EmptyState
					icon={<IconHourglass size={22} />}
					title="No crawl of this client has finished yet"
					description="Issues appear here once its first crawl is done."
				/>
			)}
			{view.kind === "empty" && (
				<EmptyState
					icon={<IconCircleCheck size={22} />}
					title="No issues on the latest crawl"
				/>
			)}
			{view.kind === "filteredEmpty" && (
				<EmptyState
					icon={<IconFilterOff size={22} />}
					title="No issues match these filters"
					action={
						<Button
							variant="light"
							onClick={() =>
								update({
									levels: ["error", "warning", "notice"],
									type: "all",
									q: undefined,
									pageId: undefined,
								})
							}
						>
							Clear filters
						</Button>
					}
				/>
			)}
			{view.kind === "ready" && (
				<>
					{search.pageId !== undefined && pageTitle === null && (
						<Group>
							<Text size="sm" c="dimmed">
								That page has no issues of its own here; the site-wide ones below
								still apply to it.
							</Text>
						</Group>
					)}
					{search.group === "issue" ? (
						<IssuesByIssue
							issues={view.issues}
							currentPages={view.report.currentPages}
						/>
					) : (
						<IssuesByPage issues={view.issues} />
					)}
				</>
			)}
		</Stack>
	);
}
