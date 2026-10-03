import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
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

	it("deletes a client only after confirming", async () => {
		const remove = vi.spyOn(ClientGateway.prototype, "remove").mockResolvedValue();
		useClientsViewModel.setState({
			status: "ready",
			clients: [client(1, "Doomed", "failed"), client(2, "Kept", "succeeded")],
		});
		renderWithProviders(() => <ClientsTable expandedClientId={undefined} onToggle={vi.fn()} />);
		const user = userEvent.setup();

		await user.click(await screen.findByRole("button", { name: "Delete Doomed" }));
		expect(remove).not.toHaveBeenCalled();
		await user.click(await screen.findByRole("button", { name: "Delete" }));

		expect(remove).toHaveBeenCalledWith(1);
		await waitFor(() => expect(screen.queryByText("Doomed")).not.toBeInTheDocument());
		expect(screen.getByText("Kept")).toBeInTheDocument();
	});
});
