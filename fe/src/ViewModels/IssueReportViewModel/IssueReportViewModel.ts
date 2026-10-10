import { create } from "zustand";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { gateways } from "@Gateways/gateways";
import type { TClientIssueReport } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";

export type TReportStatus = "idle" | "loading" | "ready" | "error" | "notFound";

interface IIssueReportState {
	report: TClientIssueReport | null;
	/** The client the report (or the refusal) is about. */
	clientId: number | null;
	status: TReportStatus;
	error: string | null;
	requestId: number;
}

interface IIssueReportActions {
	/** One read per client: every filter and grouping is computed from it, in memory. */
	fetchReport: (clientId: number) => Promise<void>;
	reset: () => void;
}

export type IIssueReportViewModel = IIssueReportState & IIssueReportActions;

const initialState: IIssueReportState = {
	report: null,
	clientId: null,
	status: "idle",
	error: null,
	requestId: 0,
};

export const useIssueReportViewModel = create<IIssueReportViewModel>()((set, get) => ({
	...initialState,
	fetchReport: async (clientId) => {
		const requestId = get().requestId + 1;
		set({ requestId, clientId, status: "loading", error: null });
		try {
			const result = await gateways.issueReports.get(clientId);
			// Switching clients mid-load: the earlier answer is about the wrong client.
			if (get().requestId !== requestId) return;
			if (result.kind === "notFound") set({ status: "notFound", report: null });
			else set({ status: "ready", report: result.report });
		} catch (error: unknown) {
			if (get().requestId !== requestId) return;
			set({ status: "error", error: describeError(error) });
		}
	},
	// The request counter is NOT rewound, so a load still in flight from the previous
	// user can never pass the identity check in the next session (as in PagesViewModel).
	reset: () => set({ ...initialState, requestId: get().requestId }),
}));

registerUserStoreReset(() => useIssueReportViewModel.getState().reset());
