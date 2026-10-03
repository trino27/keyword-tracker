import { Group, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import type { TPagesSearch } from "@App/Router/SearchSchemas/PagesSearchSchema/pagesSearchSchema";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";
import { ButtonLink } from "@Modules/_Shared/RouterLink/RouterLink";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { useCrawlStatusViewModel } from "@ViewModels/CrawlStatusViewModel/CrawlStatusViewModel";
import { usePagesViewModel } from "@ViewModels/PagesViewModel/PagesViewModel";
import { describeResultRange } from "@ViewModels/PagesViewModel/Services/DescribeResultRange/describeResultRange";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { CrawlBanner } from "./CrawlBanner/CrawlBanner";
import { PagesFilterBar, type TPagesFilterChange } from "./PagesFilterBar/PagesFilterBar";
import { PagesPagination } from "./PagesPagination/PagesPagination";
import { PagesTable } from "./PagesTable/PagesTable";

/**
 * Every tracked blog post, filtered, searched and paged through the URL. Filtered to
 * one client, it also follows that client's crawl and reloads when the crawl ends.
 */
export function PagesScreen() {
	const search = useSearch({ from: "/app/pages" });
	const navigate = useNavigate({ from: "/pages" });
	const timeZone = useSessionViewModel((state) => state.user?.timeZone ?? "UTC");

	const clients = useClientsViewModel((state) => state.clients);
	const clientsStatus = useClientsViewModel((state) => state.status);
	const fetchClients = useClientsViewModel((state) => state.fetchClients);
	const refreshClients = useClientsViewModel((state) => state.refreshClients);

	const pages = usePagesViewModel();
	const crawledClient = useCrawlStatusViewModel((state) => state.client);
	const finishedCount = useCrawlStatusViewModel((state) => state.finishedCount);
	const startPolling = useCrawlStatusViewModel((state) => state.startPolling);
	const stopPolling = useCrawlStatusViewModel((state) => state.stopPolling);

	const query = useMemo(
		() => ({
			clientId: search.clientId,
			q: search.q,
			page: search.page,
			pageSize: search.pageSize,
		}),
		[search.clientId, search.q, search.page, search.pageSize],
	);

	useEffect(() => {
		if (clientsStatus === "idle") void fetchClients();
	}, [clientsStatus, fetchClients]);

	const { fetchPages, refreshPages } = pages;
	useEffect(() => {
		void fetchPages(query, clients.length);
		// The client count only shapes the empty state; it is not a reason to reload.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query, fetchPages]);

	useEffect(() => {
		if (search.clientId === undefined) return;
		startPolling(search.clientId);
		return stopPolling;
	}, [search.clientId, startPolling, stopPolling]);

	// A crawl this screen watched has just ended: its pages are new.
	useEffect(() => {
		if (finishedCount === 0) return;
		void refreshPages(query, clients.length);
		void refreshClients();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [finishedCount]);

	const update = (change: Partial<TPagesSearch>, resetPage = true) =>
		void navigate({
			search: (previous) => ({ ...previous, ...change, ...(resetPage ? { page: 1 } : {}) }),
		});

	const bannerClient =
		search.clientId !== undefined && crawledClient?.id === search.clientId
			? crawledClient
			: null;

	return (
		<Stack gap="md">
			<PageHeader
				title="Pages"
				description="The first 15 blog posts of each client's site, with the keywords they target and where they rank."
				actions={
					<ButtonLink to="/clients" leftSection={<IconPlus size={16} />} variant="light">
						Add client
					</ButtonLink>
				}
			/>
			<PagesFilterBar
				search={search}
				clients={clients}
				onChange={(change: TPagesFilterChange) => update(change)}
			/>
			<CrawlBanner client={bannerClient} />
			<Group justify="space-between">
				<Text size="sm" c="dimmed" aria-live="polite">
					{pages.status === "ready"
						? describeResultRange(pages.page, pages.pageSize, pages.total)
						: " "}
				</Text>
			</Group>
			<PagesTable
				items={pages.items}
				status={pages.status}
				error={pages.error}
				emptyKind={pages.emptyKind}
				timeZone={timeZone}
				showClient={search.clientId === undefined}
				onRetry={() => void fetchPages(query, clients.length)}
				onClearSearch={() => update({ q: undefined })}
			/>
			{pages.total > 0 && (
				<PagesPagination
					page={search.page}
					pageSize={search.pageSize}
					total={pages.total}
					onPage={(page) => update({ page }, false)}
					onPageSize={(pageSize) => update({ pageSize })}
				/>
			)}
		</Stack>
	);
}
