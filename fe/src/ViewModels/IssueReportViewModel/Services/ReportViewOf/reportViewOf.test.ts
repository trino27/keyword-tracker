import { describe, expect, it } from "vitest";
import type { TClientIssueReport } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { siteCheck } from "../_Testing/reportRows";
import { reportViewOf, type IReportViewInput } from "./reportViewOf";

const REPORT: TClientIssueReport = {
	client: { id: 7, name: "Yoast" },
	generatedFrom: { runId: 1, finishedAt: "2026-10-09T18:02:00.000Z" },
	pageSpeedAvailability: { state: "active" },
	currentPages: 15,
	issues: [siteCheck()],
};

const input = (overrides: Partial<IReportViewInput>): IReportViewInput => ({
	clientsStatus: "ready",
	clientCount: 2,
	clientsError: null,
	status: "ready",
	error: null,
	report: REPORT,
	filtered: REPORT.issues,
	...overrides,
});

describe("reportViewOf", () => {
	it("shows the rows when there are some", () => {
		expect(reportViewOf(input({})).kind).toBe("ready");
	});

	it("says there are no clients before anything else that is not an error", () => {
		expect(reportViewOf(input({ clientCount: 0, status: "notFound" })).kind).toBe("noClients");
	});

	it("says a client was not found", () => {
		expect(reportViewOf(input({ status: "notFound", report: null })).kind).toBe("notFound");
	});

	it("says no crawl has finished yet", () => {
		expect(
			reportViewOf(input({ report: { ...REPORT, generatedFrom: null, issues: [] } })).kind,
		).toBe("noRun");
	});

	it("tells a crawl with nothing found from filters that hide everything", () => {
		expect(reportViewOf(input({ report: { ...REPORT, issues: [] }, filtered: [] })).kind).toBe(
			"empty",
		);
		expect(reportViewOf(input({ filtered: [] })).kind).toBe("filteredEmpty");
	});

	it("shows a load failure with its reason", () => {
		expect(reportViewOf(input({ status: "error", error: "offline", report: null }))).toEqual({
			kind: "error",
			message: "offline",
		});
	});

	it("is loading until the report for the client has arrived", () => {
		expect(reportViewOf(input({ status: "loading", report: null })).kind).toBe("loading");
	});

	it("keeps the last report in view while it is read again", () => {
		expect(reportViewOf(input({ status: "loading" })).kind).toBe("ready");
	});
});
