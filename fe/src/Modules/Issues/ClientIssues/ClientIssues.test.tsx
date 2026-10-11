import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import type { TClientIssueReport } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import type { IClientReport } from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { ClientIssues } from "./ClientIssues";

const SEARCH: TIssuesSearch = {
	group: "issue",
	levels: ["error", "warning", "notice"],
	type: "all",
};

const REPORT: TClientIssueReport = {
	client: { id: 7, name: "Yoast" },
	generatedFrom: { runId: 3, finishedAt: "2026-10-09T18:02:00.000Z" },
	pageSpeedAvailability: { state: "active" },
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
			code: "CWV_INP_NEEDS_IMPROVEMENT",
			severity: "notice",
			details: { value: 231, max: 200, source: "origin" },
			location: { kind: "allPages", pageCount: 15 },
		},
	],
};

const ready = (report: TClientIssueReport = REPORT): IClientReport => ({
	status: "ready",
	report,
	error: null,
	requestId: 1,
});

const show = (
	entry: IClientReport,
	options: { section?: boolean; search?: TIssuesSearch } = {},
) => {
	const onRetry = vi.fn();
	const onClearFilters = vi.fn();
	const onShowOnly = vi.fn();
	renderWithProviders(() => (
		<ClientIssues
			section={options.section ? { name: "Yoast", site: "yoast.com", onShowOnly } : undefined}
			entry={entry}
			search={options.search ?? SEARCH}
			timeZone="America/Toronto"
			pageTitle={null}
			onRetry={onRetry}
			onClearFilters={onClearFilters}
		/>
	));
	return { onRetry, onClearFilters, onShowOnly };
};

describe("ClientIssues", () => {
	describe("as one section of All clients", () => {
		it("heads its findings with the client's name, site, crawl date and count", async () => {
			const { onShowOnly } = show(ready(), { section: true });

			const section = await screen.findByRole("region", { name: "Yoast" });
			expect(within(section).getByText("yoast.com")).toBeInTheDocument();
			// The crawl's time in the user's zone: 18:02 UTC is 2:02 PM in Toronto.
			expect(within(section).getByText(/From the crawl that finished/)).toHaveTextContent(
				/2:02/,
			);
			expect(within(section).getByLabelText("2 issues")).toBeInTheDocument();
			expect(
				within(section).getByText("This page has no title for search results"),
			).toBeInTheDocument();

			fireEvent.click(within(section).getByRole("button", { name: "Yoast" }));
			expect(onShowOnly).toHaveBeenCalledOnce();
		});

		it("counts only what the filters let through", async () => {
			show(ready(), { section: true, search: { ...SEARCH, levels: ["error"] } });

			const section = await screen.findByRole("region", { name: "Yoast" });
			expect(within(section).getByLabelText("1 issue")).toBeInTheDocument();
			expect(within(section).queryByText(/Interactions/)).not.toBeInTheDocument();
		});

		it.each([
			[
				"no finished crawl",
				ready({ ...REPORT, generatedFrom: null, issues: [] }),
				"No crawl of this client has finished yet.",
			],
			["no findings", ready({ ...REPORT, issues: [] }), "No issues on the latest crawl."],
			[
				"a client deleted meanwhile",
				{ status: "notFound", report: null, error: null, requestId: 1 },
				"This client is no longer available.",
			],
		])("says %s in one line", async (_, entry, line) => {
			show(entry, { section: true });

			expect(await screen.findByText(line)).toBeInTheDocument();
		});

		it("says nothing matches the filters without a full-screen state", async () => {
			show(ready(), { section: true, search: { ...SEARCH, type: "site" } });

			expect(
				await screen.findByText("Nothing here matches these filters."),
			).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
		});

		it("offers Retry for its own failed read", async () => {
			const { onRetry } = show(
				{ status: "error", report: null, error: "offline", requestId: 1 },
				{ section: true },
			);

			fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
			expect(onRetry).toHaveBeenCalledOnce();
		});

		it("shows a stand-in while it loads", async () => {
			show({ status: "loading", report: null, error: null, requestId: 1 }, { section: true });

			expect(await screen.findByLabelText("Loading issues")).toBeInTheDocument();
		});
	});

	describe("as the one client on the screen", () => {
		it("offers Clear filters when the filters hide everything", async () => {
			const { onClearFilters } = show(ready(), { search: { ...SEARCH, type: "site" } });

			fireEvent.click(await screen.findByRole("button", { name: "Clear filters" }));
			expect(onClearFilters).toHaveBeenCalledOnce();
		});

		it("has no section heading", async () => {
			show(ready());

			await screen.findByText("This page has no title for search results");
			expect(screen.queryByRole("region")).not.toBeInTheDocument();
		});
	});
});
