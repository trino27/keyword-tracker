import { beforeEach, describe, expect, it, vi } from "vitest";
import { IssueReportGateway } from "@Gateways/IssueReportGateway/IssueReportGateway";
import type {
	TClientIssueReport,
	TIssueReportResult,
} from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { useIssueReportViewModel } from "./IssueReportViewModel";

const report = (clientId: number): TClientIssueReport => ({
	client: { id: clientId, name: `Client ${clientId}` },
	generatedFrom: { runId: 1, finishedAt: "2026-10-09T18:02:00.000Z" },
	pageSpeedAvailability: { state: "active" },
	currentPages: 15,
	issues: [],
});
const vm = () => useIssueReportViewModel.getState();

beforeEach(() => {
	vi.restoreAllMocks();
	vm().reset();
});

describe("IssueReportViewModel", () => {
	it("loads a client's report", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: report(7),
		});

		await vm().fetchReport(7);

		expect(vm()).toMatchObject({ status: "ready", clientId: 7, report: report(7) });
	});

	it("says a foreign or deleted client was not found", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({ kind: "notFound" });

		await vm().fetchReport(9);

		expect(vm()).toMatchObject({ status: "notFound", report: null });
	});

	it("drops a superseded answer — the earlier client's report", async () => {
		let answerFirst: (value: TIssueReportResult) => void = () => {};
		vi.spyOn(IssueReportGateway.prototype, "get")
			.mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
			.mockResolvedValueOnce({ kind: "report", report: report(8) });

		const first = vm().fetchReport(7);
		await vm().fetchReport(8);
		answerFirst({ kind: "report", report: report(7) });
		await first;

		expect(vm().report?.client.id).toBe(8);
	});

	it("switching clients clears the previous report while the next one loads", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get")
			.mockResolvedValueOnce({ kind: "report", report: report(7) })
			.mockImplementationOnce(() => new Promise(() => undefined));
		await vm().fetchReport(7);

		void vm().fetchReport(8);

		expect(vm()).toMatchObject({ clientId: 8, status: "loading", report: null });
	});

	it("a failed load shows the reason", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockRejectedValue(new Error("offline"));

		await vm().fetchReport(7);

		expect(vm()).toMatchObject({ status: "error", error: "offline" });
	});

	it("reset on sign-out forgets the report", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({
			kind: "report",
			report: report(7),
		});
		await vm().fetchReport(7);

		vm().reset();

		expect(vm()).toMatchObject({ status: "idle", report: null, clientId: null });
	});
});
