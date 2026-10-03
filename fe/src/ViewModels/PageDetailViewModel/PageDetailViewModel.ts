import { create } from "zustand";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { ApiError } from "@Gateways/_Shared/Errors/ApiError/ApiError";
import { gateways } from "@Gateways/gateways";
import type { TPageDetail, TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import type { TLoadStatus } from "../ClientsViewModel/ClientsViewModel";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";
import type { IDayRange } from "./Services/ResolveRange/resolveRange";

interface IPageDetailState {
	pageId: number | null;
	detail: TPageDetail | null;
	detailStatus: TLoadStatus;
	detailError: string | null;
	/** Missing, another user's, or dropped by a newer crawl — one answer from the server. */
	notFound: boolean;
	history: TPositionHistory | null;
	historyStatus: TLoadStatus;
	historyError: string | null;
	detailRequest: number;
	historyRequest: number;
}

interface IPageDetailActions {
	fetchDetail: (pageId: number) => Promise<void>;
	/** The chart's range changed: the newest request wins, older answers are dropped. */
	fetchHistory: (pageId: number, range: IDayRange) => Promise<void>;
	reset: () => void;
}

export type IPageDetailViewModel = IPageDetailState & IPageDetailActions;

const initialState: IPageDetailState = {
	pageId: null,
	detail: null,
	detailStatus: "idle",
	detailError: null,
	notFound: false,
	history: null,
	historyStatus: "idle",
	historyError: null,
	detailRequest: 0,
	historyRequest: 0,
};

const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404;

export const usePageDetailViewModel = create<IPageDetailViewModel>()((set, get) => ({
	...initialState,

	fetchDetail: async (pageId) => {
		const detailRequest = get().detailRequest + 1;
		const samePage = get().pageId === pageId;
		set({
			pageId,
			detailRequest,
			detailStatus: "loading",
			detailError: null,
			notFound: false,
			...(samePage ? {} : { detail: null, history: null, historyStatus: "idle" }),
		});
		try {
			const detail = await gateways.pages.get(pageId);
			if (get().detailRequest !== detailRequest) return;
			set({ detail, detailStatus: "ready" });
		} catch (error: unknown) {
			if (get().detailRequest !== detailRequest) return;
			set(
				isNotFound(error)
					? { detailStatus: "ready", notFound: true, detail: null }
					: { detailStatus: "error", detailError: describeError(error) },
			);
		}
	},

	fetchHistory: async (pageId, range) => {
		const historyRequest = get().historyRequest + 1;
		set({ historyRequest, historyStatus: "loading", historyError: null });
		try {
			const history = await gateways.pages.positions(pageId, range.from, range.to);
			if (get().historyRequest !== historyRequest) return;
			set({ history, historyStatus: "ready" });
		} catch (error: unknown) {
			if (get().historyRequest !== historyRequest) return;
			set(
				isNotFound(error)
					? { historyStatus: "ready", notFound: true }
					: { historyStatus: "error", historyError: describeError(error) },
			);
		}
	},

	reset: () => set(initialState),
}));

registerUserStoreReset(() => usePageDetailViewModel.getState().reset());
