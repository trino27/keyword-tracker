import { fireEvent, screen, within } from "@testing-library/react";
import { Accordion } from "@mantine/core";
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
	const issues = (
		<ClientIssues
			section={
				options.section
					? { id: 7, name: "Yoast", site: "yoast.com", onShowOnly }
					: undefined
			}
			entry={entry}
			search={options.search ?? SEARCH}
			timeZone="America/Toronto"
			pageTitle={null}
			onRetry={onRetry}
			onClearFilters={onClearFilters}
		/>
	);
	// A section is an item of the screen's accordion, so it is rendered inside one.
	renderWithProviders(() =>
		options.section ? <Accordion multiple>{issues}</Accordion> : issues,
	);
	return { onRetry, onClearFilters, onShowOnly };
};

const BY_PAGE: TIssuesSearch = { ...SEARCH, group: "page" };

/** The item's header: the control that folds it, named by everything it says. */
const header = () => screen.findByRole("button", { name: /Yoast/ });

describe("ClientIssues", () => {
	describe("as one client's item of All clients, by page", () => {
		it("heads it with the client's name, site, crawl date and count, folded", async () => {
			show(ready(), { section: true, search: BY_PAGE });

			const control = await header();
			expect(control).toHaveAttribute("aria-expanded", "false");
			expect(within(control).getByText("yoast.com")).toBeInTheDocument();
			// The crawl's time in the user's zone: 18:02 UTC is 2:02 PM in Toronto.
			expect(within(control).getByText(/From the crawl that finished/)).toHaveTextContent(
				/2:02/,
			);
			expect(within(control).getByLabelText("2 issues")).toBeInTheDocument();
		});

		it("unfolds onto the client's pages and their problems", async () => {
			show(ready(), { section: true, search: BY_PAGE });

			fireEvent.click(await header());

			expect(await header()).toHaveAttribute("aria-expanded", "true");
			expect(await screen.findByRole("link", { name: "A post" })).toBeVisible();
			expect(screen.getByText("Whole site")).toBeInTheDocument();
		});

		it("offers to show only this client, outside the fold", async () => {
			const { onShowOnly } = show(ready(), { section: true, search: BY_PAGE });

			fireEvent.click(await screen.findByRole("button", { name: "Only this client" }));

			expect(onShowOnly).toHaveBeenCalledOnce();
			expect(await header()).toHaveAttribute("aria-expanded", "false");
		});

		it("counts only what the filters let through", async () => {
			show(ready(), { section: true, search: { ...BY_PAGE, levels: ["error"] } });

			expect(within(await header()).getByLabelText("1 issue")).toBeInTheDocument();
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
				{ status: "notFound" as const, report: null, error: null, requestId: 1 },
				"This client is no longer available.",
			],
			["nothing matching the filters", ready(), "Nothing here matches these filters."],
		])("says %s in one line once unfolded", async (label, entry, line) => {
			show(entry, {
				section: true,
				search:
					label === "nothing matching the filters"
						? { ...BY_PAGE, type: "site" }
						: BY_PAGE,
			});

			fireEvent.click(await header());

			expect(await screen.findByText(line)).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
		});

		it("offers Try again for its own failed read", async () => {
			const { onRetry } = show(
				{ status: "error", report: null, error: "offline", requestId: 1 },
				{ section: true, search: BY_PAGE },
			);

			fireEvent.click(await header());
			fireEvent.click(await screen.findByRole("button", { name: "Try again" }));

			expect(onRetry).toHaveBeenCalledOnce();
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
