import { MantineProvider } from "@mantine/core";
import {
	createMemoryHistory,
	createRootRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
import type { TCrawlRunDetail } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { useClientsViewModel } from "@ViewModels/ClientsViewModel/ClientsViewModel";
import { RunLog } from "./RunLog";

const RUN: TCrawlRunDetail = {
	id: 3,
	clientId: 7,
	status: "succeeded",
	trigger: "user",
	pagesFound: 1133,
	pagesDone: 15,
	errorCode: null,
	errorMessage: null,
	createdAt: "2026-10-03T12:00:00.000Z",
	startedAt: "2026-10-03T12:00:01.000Z",
	finishedAt: "2026-10-03T12:00:03.000Z",
	sitemapUrl: "https://yoast.com/post-sitemap.xml",
	selectionReason: "Selected https://yoast.com/post-sitemap.xml with score 6",
	items: [
		{
			sitemapPosition: 0,
			url: "https://yoast.com/seo-blog/",
			status: "skipped_listing",
			reason: "Declares itself a listing (JSON-LD CollectionPage)",
			httpStatus: 200,
			pageId: null,
		},
		{
			sitemapPosition: 1,
			url: "https://yoast.com/how-to-remove-www-from-your-url/",
			status: "crawled",
			reason: null,
			httpStatus: 200,
			pageId: 42,
		},
	],
	siteChecks: [
		{
			code: "SOFT_404",
			status: "failed",
			severity: "warning",
			details: {
				evidence: [
					"GET https://yoast.com/seo-keyword-tracker-missing-page-3/ answered 200",
				],
			},
		},
		{ code: "ROBOTS_TXT_TRUNCATED", status: "passed", severity: "warning", details: {} },
		{ code: "HOST_REDIRECT_CHAIN", status: "notApplicable", severity: "notice", details: {} },
	],
};

beforeEach(() => {
	vi.restoreAllMocks();
	useClientsViewModel.getState().reset();
});

describe("RunLog", () => {
	it("lists every considered entry in sitemap order with its result and reason", async () => {
		vi.spyOn(ClientGateway.prototype, "getRun").mockResolvedValue(RUN);
		const router = createRouter({
			routeTree: createRootRoute({ component: () => <RunLog runId={3} /> }),
			history: createMemoryHistory({ initialEntries: ["/clients"] }),
		});
		render(
			<MantineProvider>
				<RouterProvider router={router as never} />
			</MantineProvider>,
		);

		const rows = (await screen.findAllByRole("row")).slice(1);
		expect(rows).toHaveLength(2);
		expect(within(rows[0]).getByText("Listing page")).toBeInTheDocument();
		expect(
			within(rows[0]).getByText("Declares itself a listing (JSON-LD CollectionPage)"),
		).toBeInTheDocument();
		expect(within(rows[1]).getByRole("link")).toHaveAttribute("href", "/pages/42");
		expect(screen.getByText("https://yoast.com/post-sitemap.xml")).toBeInTheDocument();
	});

	// A site check's failure shows its proof and its source; passes and skips are named,
	// so a check that was not run never reads as one that passed.
	it("shows the site checks: the failure with its evidence, the rest by name", async () => {
		vi.spyOn(ClientGateway.prototype, "getRun").mockResolvedValue(RUN);
		const router = createRouter({
			routeTree: createRootRoute({ component: () => <RunLog runId={3} /> }),
			history: createMemoryHistory({ initialEntries: ["/clients"] }),
		});
		render(
			<MantineProvider>
				<RouterProvider router={router as never} />
			</MantineProvider>,
		);

		expect(await screen.findByText("Missing pages answer 200 (soft 404)")).toBeInTheDocument();
		expect(
			screen.getByText(
				"GET https://yoast.com/seo-keyword-tracker-missing-page-3/ answered 200",
			),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", {
				name: "Google: How HTTP status codes, and network and DNS errors affect Google Search",
			}),
		).toBeInTheDocument();
		expect(screen.getByText(/^Passed: robots.txt is past 500 KiB/)).toBeInTheDocument();
		expect(screen.getByText(/^Not judged: Host redirects form a chain/)).toBeInTheDocument();
	});
});
