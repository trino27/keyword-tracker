import { Accordion, Alert, Select, Skeleton, Stack, Text } from "@mantine/core";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { IconBuildingStore, IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useMemo } from "react";
import {
	DEFAULT_LEVELS,
	type TIssuesSearch,
} from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import { pageSpeedAvailabilityCopy } from "@Core/Constants/pageSpeedAvailabilityCopy";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";
import { ButtonLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { SectionError } from "@Modules/_Shared/SectionError/SectionError";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import {
	PENDING_REPORT,
	useIssueReportViewModel,
} from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { useScreenFiltersViewModel } from "@ViewModels/ScreenFiltersViewModel/ScreenFiltersViewModel";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { AllClientsByIssue } from "./AllClientsByIssue/AllClientsByIssue";
import { ClientIssues } from "./ClientIssues/ClientIssues";
import { IssueFilters } from "./IssueFilters/IssueFilters";
import { SeverityRubric } from "./SeverityRubric/SeverityRubric";

/**
 * Every problem the tracker knows about a client's site — or every client's, one section
 * each — on one screen: what is wrong, why it costs traffic, what to do and whom to ask,
 * worst first, by problem or by page. One read per client; every filter and grouping
 * works on it in memory.
 */
export function IssuesScreen() {
	const search = useSearch({ from: "/app/issues" });
	const navigate = useNavigate({ from: "/issues" });
	const timeZone = useSessionViewModel((state) => state.user?.timeZone ?? "UTC");

	const clients = useClientsViewModel((state) => state.clients);
	const clientsStatus = useClientsViewModel((state) => state.status);
	const clientsError = useClientsViewModel((state) => state.error);
	const fetchClients = useClientsViewModel((state) => state.fetchClients);

	const byClient = useIssueReportViewModel((state) => state.byClient);
	const fetchReport = useIssueReportViewModel((state) => state.fetchReport);
	const fetchReports = useIssueReportViewModel((state) => state.fetchReports);

	const update = (change: Partial<TIssuesSearch>) =>
		void navigate({ search: (previous) => ({ ...previous, ...change }), replace: true });
	const clearFilters = () =>
		update({ levels: DEFAULT_LEVELS, type: "all", q: undefined, pageId: undefined });

	useEffect(() => {
		if (clientsStatus === "idle") void fetchClients();
	}, [clientsStatus, fetchClients]);

	// "All clients" (no client in the URL) is one section per client, by name.
	const sortedClients = useMemo(
		() => [...clients].sort((a, b) => a.name.localeCompare(b.name)),
		[clients],
	);
	const clientIdsKey = sortedClients.map((client) => client.id).join(",");
	const reportClients = useMemo(
		() => sortedClients.map(({ id, name, siteKey }) => ({ id, name, site: siteKey })),
		[sortedClients],
	);

	useEffect(() => {
		if (search.clientId !== undefined) void fetchReport(search.clientId);
		else if (clientsStatus === "ready" && clientIdsKey !== "")
			void fetchReports(clientIdsKey.split(",").map(Number));
	}, [search.clientId, clientsStatus, clientIdsKey, fetchReport, fetchReports]);

	// Remembered, so the navigation reopens the report as it was.
	const rememberIssues = useScreenFiltersViewModel((state) => state.rememberIssues);
	useEffect(() => rememberIssues(search), [search, rememberIssues]);

	const { clientId } = search;
	const single = clientId === undefined ? null : (byClient[clientId] ?? PENDING_REPORT);

	const pageTitle = useMemo(() => {
		for (const row of single?.report?.issues ?? [])
			if (row.location.kind === "page" && row.location.page.id === search.pageId)
				return row.location.page.title ?? row.location.page.url;
		return null;
	}, [single?.report, search.pageId]);

	// The key is the deployment's, so any one report says what state speed is in.
	const anyReport = single
		? single.report
		: (sortedClients.map((client) => byClient[client.id]?.report).find(Boolean) ?? null);
	const speedNotice = anyReport
		? pageSpeedAvailabilityCopy[anyReport.pageSpeedAvailability.state]
		: null;

	// A client id in the URL that is no longer the user's: the selector names it as the
	// body does, rather than falling back to "All clients" above a "not found".
	const missingClient =
		clientId !== undefined &&
		clientsStatus === "ready" &&
		!sortedClients.some((client) => client.id === clientId);
	const clientOptions = [
		...sortedClients.map((client) => ({ value: String(client.id), label: client.name })),
		...(missingClient
			? [{ value: String(clientId), label: "Client not found", disabled: true }]
			: []),
	];

	const clientsView =
		clientsStatus === "error"
			? "error"
			: clientsStatus === "ready"
				? clients.length === 0
					? "noClients"
					: "ready"
				: "loading";

	return (
		<Stack gap="md">
			<PageHeader
				title="Issues"
				description="Every problem found on your clients' sites, worst first, with why it matters and what to do."
				actions={
					<Select
						aria-label="Client"
						placeholder="All clients"
						data={clientOptions}
						value={search.clientId === undefined ? null : String(search.clientId)}
						onChange={(value) =>
							update({
								clientId: value === null ? undefined : Number(value),
								pageId: undefined,
								q: undefined,
							})
						}
						clearable
						w={240}
					/>
				}
			/>
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
				anyReport && (
					<Text size="xs" c="dimmed">
						Speed figures are Google's mobile and desktop measurements; pages are
						re-measured at most once a day.
					</Text>
				)
			)}
			<IssueFilters search={search} pageTitle={pageTitle} onChange={update} />
			{clientsView === "error" && (
				<SectionError
					message={clientsError ?? "Could not load the clients."}
					onRetry={() => void fetchClients()}
				/>
			)}
			{clientsView === "noClients" && (
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
			{clientsView === "loading" && (
				<Stack gap="sm" aria-busy="true" aria-label="Loading issues">
					{[0, 1, 2].map((row) => (
						<Skeleton key={row} height={120} radius="md" />
					))}
				</Stack>
			)}
			{clientsView === "ready" &&
				(clientId !== undefined && single ? (
					<ClientIssues
						entry={single}
						search={search}
						timeZone={timeZone}
						pageTitle={pageTitle}
						onRetry={() => void fetchReport(clientId)}
						onClearFilters={clearFilters}
					/>
				) : search.group === "issue" ? (
					// All clients, by issue: one list, each card's pages grouped by client.
					<AllClientsByIssue
						clients={reportClients}
						byClient={byClient}
						search={search}
						onRetry={(id) => void fetchReport(id)}
						onClearFilters={clearFilters}
					/>
				) : (
					// All clients, by page: each client folds open onto its pages.
					<Accordion multiple variant="separated" radius="md">
						{sortedClients.map((client) => (
							<ClientIssues
								key={client.id}
								section={{
									id: client.id,
									name: client.name,
									site: client.siteKey,
									onShowOnly: () => update({ clientId: client.id }),
								}}
								entry={byClient[client.id] ?? PENDING_REPORT}
								search={search}
								timeZone={timeZone}
								pageTitle={null}
								onRetry={() => void fetchReport(client.id)}
								onClearFilters={clearFilters}
							/>
						))}
					</Accordion>
				))}
		</Stack>
	);
}
