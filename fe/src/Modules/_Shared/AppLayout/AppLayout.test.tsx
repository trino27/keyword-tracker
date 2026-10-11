import { MantineProvider } from "@mantine/core";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppRouter } from "@App/Router/router";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { IssueReportGateway } from "@Gateways/IssueReportGateway/IssueReportGateway";
import { PageGateway } from "@Gateways/PageGateway/PageGateway";
import { SessionGateway } from "@Gateways/SessionGateway/SessionGateway";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { useIssueReportViewModel } from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { usePagesViewModel } from "@ViewModels/PagesViewModel/PagesViewModel";
import { useScreenFiltersViewModel } from "@ViewModels/ScreenFiltersViewModel/ScreenFiltersViewModel";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";

const CLIENT = { id: 7, name: "Yoast", siteKey: "yoast.com", latestRun: null } as TClient;

const renderAt = async (path: string) => {
	const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
	await router.load();
	render(
		<MantineProvider>
			<RouterProvider router={router} />
		</MantineProvider>,
	);
	return router;
};

const nav = (name: string) => fireEvent.click(screen.getByRole("link", { name }));

beforeEach(() => {
	vi.restoreAllMocks();
	useSessionViewModel.getState().reset();
	useClientsViewModel.getState().reset();
	usePagesViewModel.getState().reset();
	useIssueReportViewModel.getState().reset();
	useScreenFiltersViewModel.getState().reset();
	vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue({
		id: 1,
		email: "yoast.manager@example.com",
		timeZone: "America/Toronto",
	});
	vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([CLIENT]);
	vi.spyOn(PageGateway.prototype, "list").mockResolvedValue({
		items: [],
		page: 1,
		pageSize: 20,
		total: 0,
		pageSpeedAvailability: { state: "active" },
	});
	vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
		kind: "report",
		report: {
			client: { id: 7, name: "Yoast" },
			generatedFrom: { runId: 3, finishedAt: "2026-10-09T18:02:00.000Z" },
			pageSpeedAvailability: { state: "active" },
			currentPages: 15,
			issues: [],
		},
	});
});

describe("AppLayout navigation", () => {
	it("brings the reader back to the pages list as they left it", async () => {
		const router = await renderAt("/pages?clientId=7&q=seo&pageSize=50");
		await screen.findByRole("link", { name: "Issues" });

		nav("Issues");
		await waitFor(() => expect(router.state.location.pathname).toBe("/issues"));
		nav("Pages");

		await waitFor(() => expect(router.state.location.pathname).toBe("/pages"));
		expect(router.state.location.search).toMatchObject({
			clientId: 7,
			q: "seo",
			pageSize: 50,
		});
	});

	it("the brand link restores the pages list too", async () => {
		const router = await renderAt("/pages?q=seo");
		await screen.findByRole("link", { name: "Issues" });

		nav("Issues");
		await waitFor(() => expect(router.state.location.pathname).toBe("/issues"));
		nav("Keyword Tracker");

		await waitFor(() => expect(router.state.location.pathname).toBe("/pages"));
		expect(router.state.location.search).toMatchObject({ q: "seo" });
	});

	it("opens a report never opened on the client the pages list is filtered to", async () => {
		const router = await renderAt("/pages?clientId=7");
		await screen.findByRole("link", { name: "Issues" });

		nav("Issues");

		await waitFor(() => expect(router.state.location.pathname).toBe("/issues"));
		expect(router.state.location.search).toMatchObject({ clientId: 7 });
	});

	it("without any filter chosen, opens every screen on its defaults", async () => {
		const router = await renderAt("/clients");
		await screen.findByRole("link", { name: "Issues" });

		nav("Issues");

		await waitFor(() => expect(router.state.location.pathname).toBe("/issues"));
		expect(router.state.location.search.clientId).toBeUndefined();
		expect(router.state.location.search).toMatchObject({
			levels: ["error", "warning", "notice"],
			type: "all",
		});
	});

	it("offers Info as the fourth tab, opening the guide", async () => {
		const router = await renderAt("/pages");
		const main = await screen.findByRole("navigation", { name: "Main" });

		expect(Array.from(main.querySelectorAll("a"), (link) => link.textContent)).toEqual([
			"Pages",
			"Issues",
			"Clients",
			"Info",
		]);
		nav("Info");

		await waitFor(() => expect(router.state.location.pathname).toBe("/info"));
	});

	it("forgets the remembered filters on sign-out", async () => {
		vi.spyOn(SessionGateway.prototype, "logout").mockResolvedValue();
		await renderAt("/pages?clientId=7&q=seo");
		await waitFor(() => expect(useScreenFiltersViewModel.getState().pages).not.toBeNull());

		await useSessionViewModel.getState().signOut();

		expect(useScreenFiltersViewModel.getState()).toMatchObject({ pages: null, issues: null });
	});
});
