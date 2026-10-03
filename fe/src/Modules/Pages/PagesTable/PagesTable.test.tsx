import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TPageListItem } from "@Gateways/PageGateway/Validation/PageSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { PagesTable } from "./PagesTable";

const ROW: TPageListItem = {
	id: 42,
	url: "https://yoast.com/how-to-remove-www-from-your-url/",
	title: "How to remove www from your URL",
	client: { id: 7, name: "Yoast" },
	keywords: [
		{
			keywordId: 1,
			term: "remove www",
			relevance: 1,
			latestPosition: null,
			latestCapturedAt: null,
		},
	],
	bestPosition: null,
	score: { value: 83, applicable: 18, failed: 3 },
	issues: { total: 0, error: 0, warning: 0, notice: 0 },
	lastCapturedAt: null,
};

const renderTable = (props: Partial<Parameters<typeof PagesTable>[0]>) =>
	renderWithProviders(() => (
		<PagesTable
			items={[]}
			status="ready"
			error={null}
			emptyKind={null}
			timeZone="America/Toronto"
			showClient
			onRetry={vi.fn()}
			onClearSearch={vi.fn()}
			{...props}
		/>
	));

describe("PagesTable", () => {
	it("shows a skeleton while the first load runs", async () => {
		renderTable({ status: "loading" });

		expect(await screen.findByLabelText("Loading pages")).toBeInTheDocument();
	});

	it("shows the failure with a retry", async () => {
		const onRetry = vi.fn();
		renderTable({ status: "error", error: "Could not reach the server", onRetry });

		(await screen.findByRole("button", { name: "Try again" })).click();

		expect(screen.getByText("Could not reach the server")).toBeInTheDocument();
		expect(onRetry).toHaveBeenCalled();
	});

	it("offers to add a client when there are none, and to clear a fruitless search", async () => {
		const { unmount } = renderTable({ emptyKind: "noClients" });
		expect(await screen.findByRole("link", { name: "Add a client" })).toHaveAttribute(
			"href",
			"/clients",
		);
		unmount();

		renderTable({ emptyKind: "noMatches" });
		expect(await screen.findByRole("button", { name: "Clear the search" })).toBeInTheDocument();
	});

	it("a page without positions shows — and links to its detail", async () => {
		renderTable({ items: [ROW] });

		expect(await screen.findByRole("link", { name: ROW.title! })).toHaveAttribute(
			"href",
			"/pages/42",
		);
		expect(screen.getAllByText("—").length).toBeGreaterThan(0);
		expect(screen.getByText("None")).toBeInTheDocument();
	});
});
