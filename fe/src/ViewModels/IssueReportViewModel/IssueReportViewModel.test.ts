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

		expect(vm().byClient[7]).toMatchObject({ status: "ready", report: report(7) });
	});

	it("says a foreign or deleted client was not found", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockResolvedValue({ kind: "notFound" });

		await vm().fetchReport(9);

		expect(vm().byClient[9]).toMatchObject({ status: "notFound", report: null });
	});

	it("files every client's report under its own client", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockImplementation((clientId) =>
			Promise.resolve(
				clientId === 9
					? { kind: "notFound" }
					: { kind: "report", report: report(clientId) },
			),
		);

		await vm().fetchReports([7, 8, 9]);

		expect(vm().byClient[7]?.report?.client.id).toBe(7);
		expect(vm().byClient[8]?.report?.client.id).toBe(8);
		expect(vm().byClient[9]?.status).toBe("notFound");
	});

	it("drops a superseded answer — an earlier read of the same client", async () => {
		const stale = { ...report(7), currentPages: 1 };
		let answerFirst: (value: TIssueReportResult) => void = () => {};
		vi.spyOn(IssueReportGateway.prototype, "get")
			.mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
			.mockResolvedValueOnce({ kind: "report", report: report(7) });

		const first = vm().fetchReport(7);
		await vm().fetchReport(7);
		answerFirst({ kind: "report", report: stale });
		await first;

		expect(vm().byClient[7]?.report?.currentPages).toBe(15);
	});

	it("keeps a client's report in view while it is read again", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get")
			.mockResolvedValueOnce({ kind: "report", report: report(7) })
			.mockImplementationOnce(() => new Promise(() => undefined));
		await vm().fetchReport(7);

		void vm().fetchReport(7);

		expect(vm().byClient[7]).toMatchObject({ status: "loading", report: report(7) });
	});

	it("a failed load shows the reason", async () => {
		vi.spyOn(IssueReportGateway.prototype, "get").mockRejectedValue(new Error("offline"));

		await vm().fetchReport(7);

		expect(vm().byClient[7]).toMatchObject({ status: "error", error: "offline" });
	});

	it("reset on sign-out forgets the reports, and an answer still in flight", async () => {
		let answer: (value: TIssueReportResult) => void = () => {};
		vi.spyOn(IssueReportGateway.prototype, "get").mockImplementation(
			() => new Promise((resolve) => (answer = resolve)),
		);
		const load = vm().fetchReport(7);

		vm().reset();
		answer({ kind: "report", report: report(7) });
		await load;

		expect(vm().byClient).toEqual({});
	});
});
