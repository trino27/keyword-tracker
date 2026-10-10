import type {
	TClientIssueReport,
	TReportIssue,
} from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import type { TLoadStatus } from "../../../ClientsViewModel/ClientsViewModel";
import type { TReportStatus } from "../../IssueReportViewModel";

/** Every state of the report screen, decided in one place, in one order. */
export type TReportView =
	| { kind: "loading" }
	| { kind: "error"; message: string }
	| { kind: "noClients" }
	| { kind: "notFound" }
	| { kind: "noRun"; report: TClientIssueReport }
	| { kind: "empty"; report: TClientIssueReport }
	| { kind: "filteredEmpty"; report: TClientIssueReport }
	| { kind: "ready"; report: TClientIssueReport; issues: TReportIssue[] };

export interface IReportViewInput {
	clientsStatus: TLoadStatus;
	clientCount: number;
	clientsError: string | null;
	status: TReportStatus;
	error: string | null;
	report: TClientIssueReport | null;
	/** The report's rows after the reader's filters. */
	filtered: TReportIssue[];
}

/**
 * Errors first, then what cannot be shown at all (no clients, not found), then the
 * report's own emptiness — a client never crawled, a crawl with nothing found, filters
 * that hide everything — and only then the rows.
 */
export function reportViewOf(input: IReportViewInput): TReportView {
	if (input.clientsStatus === "error")
		return { kind: "error", message: input.clientsError ?? "Could not load the clients." };
	if (input.clientsStatus === "ready" && input.clientCount === 0) return { kind: "noClients" };
	if (input.status === "error")
		return { kind: "error", message: input.error ?? "Could not load the report." };
	if (input.status === "notFound") return { kind: "notFound" };
	if (input.status !== "ready" || !input.report) return { kind: "loading" };
	const { report } = input;
	if (report.generatedFrom === null) return { kind: "noRun", report };
	if (report.issues.length === 0) return { kind: "empty", report };
	if (input.filtered.length === 0) return { kind: "filteredEmpty", report };
	return { kind: "ready", report, issues: input.filtered };
}
