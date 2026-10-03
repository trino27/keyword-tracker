import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { ClientsTable } from "./ClientsTable";

const client = (id: number, name: string, status: TCrawlRunSummary["status"]): TClient => ({
	id,
	name,
	websiteUrl: `https://${name.toLowerCase()}.example`,
	siteKey: `${name.toLowerCase()}.example`,
	currentPageCount: 15,
	latestRun: {
		id: id * 10,
		status,
		trigger: "user",
		pagesFound: 100,
		pagesDone: 6,
		errorCode: null,
		errorMessage: null,
		createdAt: "2026-10-03T12:00:00.000Z",
		startedAt: "2026-10-03T12:00:01.000Z",
		finishedAt: status === "running" ? null : "2026-10-03T12:01:00.000Z",
	},
	createdAt: "2026-10-03T12:00:00.000Z",
});

beforeEach(() => {
	useClientsViewModel.getState().reset();
});

describe("ClientsTable", () => {
	it("disables re-crawl while a crawl runs, and links each client to its pages", async () => {
		useClientsViewModel.setState({
			status: "ready",
			clients: [client(1, "Busy", "running"), client(2, "Idle", "succeeded")],
		});
		renderWithProviders(() => <ClientsTable expandedClientId={undefined} onToggle={vi.fn()} />);

		const busy = (await screen.findByText("Busy")).closest("tr")!;
		const idle = screen.getByText("Idle").closest("tr")!;

		expect(within(busy).getByRole("button", { name: "Re-crawl" })).toBeDisabled();
		expect(within(busy).getByText("6 of 15 pages")).toBeInTheDocument();
		expect(within(idle).getByRole("button", { name: "Re-crawl" })).toBeEnabled();
		expect(within(idle).getByRole("link", { name: "View pages" })).toHaveAttribute(
			"href",
			"/pages?clientId=2",
		);
	});
});
