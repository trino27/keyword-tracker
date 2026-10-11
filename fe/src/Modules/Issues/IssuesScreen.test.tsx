import { MantineProvider } from "@mantine/core";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppRouter } from "@App/Router/router";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { IssueReportGateway } from "@Gateways/IssueReportGateway/IssueReportGateway";
import { PageGateway } from "@Gateways/PageGateway/PageGateway";
import type { TClientIssueReport } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { SessionGateway } from "@Gateways/SessionGateway/SessionGateway";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { useIssueReportViewModel } from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { useScreenFiltersViewModel } from "@ViewModels/ScreenFiltersViewModel/ScreenFiltersViewModel";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";

const CLIENT = { id: 7, name: "Yoast" } as TClient;

const REPORT: TClientIssueReport = {
	client: { id: 7, name: "Yoast" },
	generatedFrom: { runId: 3, finishedAt: "2026-10-09T18:02:00.000Z" },
	pageSpeedAvailability: { state: "notConfigured" },
	currentPages: 15,
	issues: [
		{
			code: "TITLE_MISSING",
			severity: "error",
			details: {},
			location: {
				kind: "page",
				page: { id: 42, url: "https://yoast.com/a/", title: "A post" },
			},
		},
		{
			code: "LANG_MISSING",
			severity: "notice",
			details: {},
			location: {
				kind: "page",
				page: { id: 42, url: "https://yoast.com/a/", title: "A post" },
			},
		},
	],
};

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

beforeEach(() => {
	vi.restoreAllMocks();
	useSessionViewModel.getState().reset();
	useClientsViewModel.getState().reset();
	useIssueReportViewModel.getState().reset();
	useScreenFiltersViewModel.getState().reset();
	vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue({
		id: 1,
		email: "yoast.manager@example.com",
		timeZone: "America/Toronto",
	});
	vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([CLIENT]);
});

describe("IssuesScreen", () => {
	it("explains each problem in plain words, worst first, with the rubric in view", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: REPORT,
		});

		await renderAt("/issues?clientId=7");

		expect(
			await screen.findByText("This page has no title for search results"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("What the levels mean")).toBeInTheDocument();
		// One card per problem, each saying why it matters.
		expect(screen.getAllByText("Why it matters")).toHaveLength(2);
		// Every level by default, Improvements included.
		expect(
			screen.getByText("The page doesn't declare what language it's written in"),
		).toBeInTheDocument();
	});

	it("keeps the chosen filters when the reader leaves for Pages and comes back", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: REPORT,
		});
		vi.spyOn(PageGateway.prototype, "list").mockResolvedValue({
			items: [],
			page: 1,
			pageSize: 20,
			total: 0,
			pageSpeedAvailability: { state: "active" },
		});
		const router = await renderAt('/issues?clientId=7&group=page&levels=["error"]');
		await screen.findAllByText("This page has no title for search results");

		fireEvent.click(screen.getByRole("link", { name: "Pages" }));
		await waitFor(() => expect(router.state.location.pathname).toBe("/pages"));
		fireEvent.click(screen.getByRole("link", { name: "Issues" }));

		await waitFor(() => expect(router.state.location.pathname).toBe("/issues"));
		expect(router.state.location.search).toMatchObject({
			clientId: 7,
			group: "page",
			levels: ["error"],
		});
	});

	it("says speed is not configured when there is no key", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: REPORT,
		});

		await renderAt("/issues?clientId=7");

		expect(await screen.findByText(/no PageSpeed key is configured/)).toBeInTheDocument();
	});

	it("says speed figures are Google's mobile and desktop measurements", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: { ...REPORT, pageSpeedAvailability: { state: "active" } },
		});

		await renderAt("/issues?clientId=7");

		expect(
			await screen.findByText(
				"Speed figures are Google's mobile and desktop measurements; pages are re-measured at most once a day.",
			),
		).toBeInTheDocument();
	});

	it("says, in red, that Google rejected the key", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: { ...REPORT, pageSpeedAvailability: { state: "keyRejected" } },
		});

		await renderAt("/issues?clientId=7");

		expect(await screen.findByText(/Google rejected the PageSpeed key/)).toBeInTheDocument();
	});

	it("with no client chosen, by issue: one list, each card's pages grouped by client", async () => {
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([
			CLIENT,
			{ id: 8, name: "Ahrefs", siteKey: "ahrefs.com" } as TClient,
			{ id: 9, name: "Backlinko", siteKey: "backlinko.com" } as TClient,
		]);
		const AHREFS: TClientIssueReport = {
			...REPORT,
			client: { id: 8, name: "Ahrefs" },
			issues: [
				{
					code: "TITLE_MISSING",
					severity: "error",
					details: {},
					location: {
						kind: "page",
						page: { id: 50, url: "https://ahrefs.com/b/", title: "B post" },
					},
				},
			],
		};
		const BACKLINKO: TClientIssueReport = {
			...REPORT,
			client: { id: 9, name: "Backlinko" },
			issues: [],
		};
		const get = vi.spyOn(IssueReportGateway.prototype, "get").mockImplementation((clientId) =>
			Promise.resolve({
				kind: "report",
				report: clientId === 7 ? REPORT : clientId === 8 ? AHREFS : BACKLINKO,
			}),
		);

		const router = await renderAt("/issues");

		// One card for the problem, not one per client.
		expect(
			await screen.findAllByText("This page has no title for search results"),
		).toHaveLength(1);
		// The Critical card comes first; inside it, equal shares follow the clients' names.
		const [yoast] = await screen.findAllByRole("group", { name: "Yoast" });
		expect(within(yoast).getByRole("link", { name: "A post" })).toBeInTheDocument();
		const card = yoast.parentElement as HTMLElement;
		expect(
			within(card)
				.getAllByRole("group")
				.map((group) => group.getAttribute("aria-label")),
		).toEqual(["Ahrefs", "Yoast"]);
		const ahrefs = within(card).getByRole("group", { name: "Ahrefs" });
		expect(within(ahrefs).getByRole("link", { name: "B post" })).toBeInTheDocument();
		expect(screen.getByText("No issues on the latest crawl: Backlinko.")).toBeInTheDocument();
		expect(get).toHaveBeenCalledTimes(3);
		expect(router.state.location.search.clientId).toBeUndefined();
	});

	it("with no client chosen, by page: each client folds open onto its pages", async () => {
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([
			CLIENT,
			{ id: 8, name: "Ahrefs", siteKey: "ahrefs.com" } as TClient,
		]);
		vi.spyOn(IssueReportGateway.prototype, "get").mockImplementation((clientId) =>
			Promise.resolve({
				kind: "report",
				report:
					clientId === 7
						? REPORT
						: { ...REPORT, client: { id: 8, name: "Ahrefs" }, issues: [] },
			}),
		);

		await renderAt("/issues?group=page");

		const yoast = await screen.findByRole("button", { name: /^Yoast/ });
		const ahrefs = screen.getByRole("button", { name: /^Ahrefs/ });
		// Folded until opened, in the clients' name order.
		expect(yoast).toHaveAttribute("aria-expanded", "false");
		expect(
			ahrefs.compareDocumentPosition(yoast) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();

		fireEvent.click(yoast);

		expect(await screen.findByRole("link", { name: "A post" })).toBeVisible();
	});

	it("in All clients, one client's failed read is named with Try again, the rest still listed", async () => {
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([
			CLIENT,
			{ id: 8, name: "Ahrefs", siteKey: "ahrefs.com" } as TClient,
		]);
		const get = vi.spyOn(IssueReportGateway.prototype, "get").mockImplementation((clientId) =>
			clientId === 8
				? Promise.reject(new Error("offline"))
				: Promise.resolve({
						kind: "report",
						report: { ...REPORT, pageSpeedAvailability: { state: "keyRejected" } },
					}),
		);

		await renderAt("/issues");

		expect(await screen.findByText("Could not load Ahrefs")).toBeInTheDocument();
		expect(
			await screen.findByText("This page has no title for search results"),
		).toBeInTheDocument();
		// The key is the deployment's: any client's report tells the state.
		expect(screen.getByText(/Google rejected the PageSpeed key/)).toBeInTheDocument();

		get.mockClear();
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		await waitFor(() => expect(get).toHaveBeenCalledWith(8));
		expect(get).not.toHaveBeenCalledWith(7);
	});

	it("Only this client narrows the report to that client", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: REPORT,
		});
		const router = await renderAt("/issues?group=page");

		fireEvent.click(await screen.findByRole("button", { name: "Only this client" }));

		await waitFor(() => expect(router.state.location.search).toMatchObject({ clientId: 7 }));
		expect(screen.queryByRole("button", { name: "Only this client" })).not.toBeInTheDocument();
	});

	it("says another user's or a deleted client was not found", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({ kind: "notFound" });

		await renderAt("/issues?clientId=999");

		expect(await screen.findByText(/This client/)).toBeInTheDocument();
		// The selector agrees with the body instead of reading "All clients".
		await waitFor(() =>
			expect(screen.getByRole("combobox", { name: "Client" })).toHaveValue(
				"Client not found",
			),
		);
	});

	it("offers to add a client when there are none", async () => {
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([]);

		await renderAt("/issues");

		expect(await screen.findByText("Add a client to see its issues")).toBeInTheDocument();
	});

	it("says no crawl has finished yet", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: { ...REPORT, generatedFrom: null, issues: [] },
		});

		await renderAt("/issues?clientId=7");

		expect(
			await screen.findByText("No crawl of this client has finished yet"),
		).toBeInTheDocument();
	});

	it("says when the filters hide everything, and clears them", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: REPORT,
		});

		await renderAt("/issues?clientId=7&type=speed");

		(await screen.findByRole("button", { name: "Clear filters" })).click();

		expect(
			await screen.findByText("This page has no title for search results"),
		).toBeInTheDocument();
	});

	it("is behind the session guard", async () => {
		vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue(null);

		const router = await renderAt("/issues?clientId=7");

		expect(router.state.location.pathname).toBe("/sign-in");
	});
});
