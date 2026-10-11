import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import type { TClientIssueReport } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import type { IClientReport } from "@ViewModels/IssueReportViewModel/IssueReportViewModel";
import { AllClientsByIssue } from "./AllClientsByIssue";

const SEARCH: TIssuesSearch = {
	group: "issue",
	levels: ["error", "warning", "notice"],
	type: "all",
};

const YOAST = { id: 7, name: "Yoast", site: "yoast.com" };
const AHREFS = { id: 8, name: "Ahrefs", site: "ahrefs.com" };

const report = (id: number, issues: TClientIssueReport["issues"]): IClientReport => ({
	status: "ready",
	error: null,
	requestId: 1,
	report: {
		client: { id, name: `Client ${id}` },
		generatedFrom: { runId: 1, finishedAt: "2026-10-09T18:02:00.000Z" },
		pageSpeedAvailability: { state: "active" },
		currentPages: 15,
		issues,
	},
});

const TITLE = (pageId: number): TClientIssueReport["issues"][number] => ({
	code: "TITLE_MISSING",
	severity: "error",
	details: {},
	location: {
		kind: "page",
		page: { id: pageId, url: `https://example.com/${pageId}/`, title: `Post ${pageId}` },
	},
});

const show = (byClient: Record<number, IClientReport>, search: TIssuesSearch = SEARCH) => {
	const onRetry = vi.fn();
	const onClearFilters = vi.fn();
	renderWithProviders(() => (
		<AllClientsByIssue
			clients={[AHREFS, YOAST]}
			byClient={byClient}
			search={search}
			onRetry={onRetry}
			onClearFilters={onClearFilters}
		/>
	));
	return { onRetry, onClearFilters };
};

describe("AllClientsByIssue", () => {
	it("stands in while no client's report is there yet", async () => {
		show({});

		expect(await screen.findByLabelText("Loading issues")).toBeInTheDocument();
	});

	it("lists what is there and names the clients still loading", async () => {
		show({ 7: report(7, [TITLE(1)]) });

		expect(await screen.findByRole("link", { name: "Post 1" })).toBeInTheDocument();
		expect(screen.getByText("Still loading: Ahrefs.")).toBeInTheDocument();
	});

	it("names clients without a finished crawl", async () => {
		show({
			7: report(7, [TITLE(1)]),
			8: { ...report(8, []), report: { ...report(8, []).report!, generatedFrom: null } },
		});
		expect(await screen.findByText("No finished crawl yet: Ahrefs.")).toBeInTheDocument();
	});

	it("keeps a client's last report listed while it is read again", async () => {
		show({ 7: { ...report(7, [TITLE(1)]), status: "loading" }, 8: report(8, []) });

		expect(await screen.findByRole("link", { name: "Post 1" })).toBeInTheDocument();
		expect(screen.queryByText(/Still loading/)).not.toBeInTheDocument();
	});

	it("names a client no longer found apart from the ones never crawled", async () => {
		show({
			7: report(7, [TITLE(1)]),
			8: { status: "notFound", report: null, error: null, requestId: 1 },
		});

		expect(await screen.findByText("No longer found: Ahrefs.")).toBeInTheDocument();
		expect(screen.queryByText(/No finished crawl yet/)).not.toBeInTheDocument();
	});

	it("names a client whose latest crawl found nothing, beside the others' problems", async () => {
		show({ 7: report(7, [TITLE(1)]), 8: report(8, []) });

		expect(
			await screen.findByText("No issues on the latest crawl: Ahrefs."),
		).toBeInTheDocument();
	});

	it("offers Clear filters when the filters hide every client's problems", async () => {
		const { onClearFilters } = show(
			{ 7: report(7, [TITLE(1)]), 8: report(8, [TITLE(2)]) },
			{ ...SEARCH, type: "speed" },
		);

		fireEvent.click(await screen.findByRole("button", { name: "Clear filters" }));
		expect(onClearFilters).toHaveBeenCalledOnce();
	});

	it("says nothing was found when no client has a problem", async () => {
		show({ 7: report(7, []), 8: report(8, []) });

		expect(await screen.findByText("No issues on the latest crawls")).toBeInTheDocument();
		expect(screen.queryByText(/No issues on the latest crawl:/)).not.toBeInTheDocument();
	});

	it("names a failed client with Try again for it alone", async () => {
		const { onRetry } = show({
			7: report(7, [TITLE(1)]),
			8: { status: "error", report: null, error: "offline", requestId: 1 },
		});

		expect(await screen.findByText("Could not load Ahrefs")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(onRetry).toHaveBeenCalledWith(8);
	});
});
