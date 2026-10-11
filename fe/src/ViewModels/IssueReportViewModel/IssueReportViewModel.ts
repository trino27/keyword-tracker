import { create } from "zustand";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { gateways } from "@Gateways/gateways";
import type { TClientIssueReport } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";

export type TReportStatus = "idle" | "loading" | "ready" | "error" | "notFound";

/** One client's report, or the reason there is none. */
export interface IClientReport {
	status: TReportStatus;
	/** Only ever this client's: a report is filed under the client it was read for. */
	report: TClientIssueReport | null;
	error: string | null;
	/** The read this entry waits for; an older answer is dropped. */
	requestId: number;
}

interface IIssueReportState {
	/** By client id: one client's screen reads one entry, "All clients" reads them all. */
	byClient: Record<number, IClientReport>;
	requestId: number;
}

interface IIssueReportActions {
	/** One read per client: every filter and grouping is computed from it, in memory. */
	fetchReport: (clientId: number) => Promise<void>;
	/** "All clients": every client's report, read side by side. */
	fetchReports: (clientIds: number[]) => Promise<void>;
	reset: () => void;
}

export type IIssueReportViewModel = IIssueReportState & IIssueReportActions;

const initialState: IIssueReportState = { byClient: {}, requestId: 0 };

/** What a client with no entry yet shows: it is about to be read. */
export const PENDING_REPORT: IClientReport = {
	status: "loading",
	report: null,
	error: null,
	requestId: 0,
};

export const useIssueReportViewModel = create<IIssueReportViewModel>()((set, get) => {
	const settle = (clientId: number, requestId: number, change: Partial<IClientReport>) => {
		const entry = get().byClient[clientId];
		// Read again since, or forgotten on sign-out: this answer is no longer wanted.
		if (entry?.requestId !== requestId) return;
		set({ byClient: { ...get().byClient, [clientId]: { ...entry, ...change } } });
	};

	return {
		...initialState,
		fetchReport: async (clientId) => {
			const requestId = get().requestId + 1;
			const previous = get().byClient[clientId];
			// The client's last report stays in view while it is read again.
			set({
				requestId,
				byClient: {
					...get().byClient,
					[clientId]: {
						status: "loading",
						report: previous?.report ?? null,
						error: null,
						requestId,
					},
				},
			});
			try {
				const result = await gateways.issueReports.get(clientId);
				if (result.kind === "notFound")
					settle(clientId, requestId, { status: "notFound", report: null });
				else settle(clientId, requestId, { status: "ready", report: result.report });
			} catch (error: unknown) {
				settle(clientId, requestId, { status: "error", error: describeError(error) });
			}
		},
		fetchReports: async (clientIds) => {
			await Promise.all(clientIds.map((clientId) => get().fetchReport(clientId)));
		},
		// The request counter is NOT rewound, so a load still in flight from the previous
		// user can never pass the identity check in the next session (as in PagesViewModel).
		reset: () => set({ ...initialState, requestId: get().requestId }),
	};
});

registerUserStoreReset(() => useIssueReportViewModel.getState().reset());
