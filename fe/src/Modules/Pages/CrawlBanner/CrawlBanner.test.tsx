import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { CrawlBanner } from "./CrawlBanner";

const client = (run: Partial<TCrawlRunSummary>): TClient => ({
	id: 7,
	name: "Yoast",
	websiteUrl: "https://yoast.com",
	siteKey: "yoast.com",
	currentPageCount: 0,
	latestRun: {
		id: 3,
		status: "running",
		trigger: "user",
		pagesFound: 940,
		pagesDone: 6,
		errorCode: null,
		errorMessage: null,
		createdAt: "2026-10-03T12:00:00.000Z",
		startedAt: null,
		finishedAt: null,
		...run,
	},
	createdAt: "2026-10-03T12:00:00.000Z",
});

describe("CrawlBanner", () => {
	it("follows a running crawl", async () => {
		renderWithProviders(() => <CrawlBanner client={client({})} />);

		expect(await screen.findByText("Crawling yoast.com — 6 of 15 pages")).toBeInTheDocument();
		expect(screen.getByLabelText("Crawl progress")).toBeInTheDocument();
	});

	it("explains a partial crawl and points to its log", async () => {
		renderWithProviders(() => (
			<CrawlBanner client={client({ status: "partial", pagesDone: 9 })} />
		));

		expect(
			await screen.findByText(
				"Only 9 of 15 posts on yoast.com could be crawled; the run log says why for each one.",
			),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Open the run log" })).toHaveAttribute(
			"href",
			"/clients?expanded=7",
		);
	});

	it("says nothing once the crawl succeeded", () => {
		const { container } = renderWithProviders(() => (
			<CrawlBanner client={client({ status: "succeeded" })} />
		));

		expect(container.querySelector('[role="alert"], [role="status"]')).toBeNull();
	});
});
