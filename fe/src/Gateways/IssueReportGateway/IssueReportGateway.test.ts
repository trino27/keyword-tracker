import { afterEach, describe, expect, it, vi } from "vitest";
import { IssueReportGateway } from "./IssueReportGateway";

const REPORT = {
	client: { id: 7, name: "Yoast" },
	generatedFrom: { runId: 3, finishedAt: "2026-10-09T18:02:00.000Z" },
	pageSpeedAvailability: { state: "active" },
	currentPages: 15,
	issues: [
		{
			code: "H1_MISSING",
			severity: "error",
			details: {},
			location: { kind: "page", page: { id: 42, url: "https://yoast.com/a/", title: "A" } },
		},
		{
			code: "CWV_INP_NEEDS_IMPROVEMENT",
			severity: "notice",
			details: { value: 210, max: 200, source: "origin" },
			location: { kind: "allPages", pageCount: 15 },
		},
		{ code: "SOFT_404", severity: "warning", details: {}, location: { kind: "site" } },
	],
};

const answer = (status: number, body: unknown) =>
	vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
	vi.restoreAllMocks();
});

describe("IssueReportGateway", () => {
	it("parses page, whole-site and site rows", async () => {
		const fetchSpy = answer(200, REPORT);

		const result = await new IssueReportGateway().get(7);

		expect(fetchSpy.mock.calls[0][0]).toBe("/api/clients/7/issues");
		expect(result).toEqual({ kind: "report", report: REPORT });
	});

	it("refuses a whole-site row that is not a speed finding", async () => {
		answer(200, {
			...REPORT,
			issues: [
				{
					code: "H1_MISSING",
					severity: "error",
					details: {},
					location: { kind: "allPages", pageCount: 3 },
				},
			],
		});

		await expect(new IssueReportGateway().get(7)).rejects.toThrow();
	});

	it("turns CLIENT_NOT_FOUND into notFound", async () => {
		answer(404, {
			statusCode: 404,
			errorCode: "CLIENT_NOT_FOUND",
			message: "Client not found",
		});

		expect(await new IssueReportGateway().get(2_000_000_000)).toEqual({ kind: "notFound" });
	});
});
