import { create } from "zustand";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { gateways } from "@Gateways/gateways";
import type { IPageListQuery } from "@Gateways/PageGateway/PageGateway";
import type { TPageListItem } from "@Gateways/PageGateway/Validation/PageSchemas";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";
import type { TLoadStatus } from "../ClientsViewModel/ClientsViewModel";
import { toEmptyKind, type TEmptyKind } from "./Services/ToEmptyKind/toEmptyKind";

interface IPagesState {
	items: TPageListItem[];
	total: number;
	page: number;
	pageSize: number;
	status: TLoadStatus;
	error: string | null;
	emptyKind: TEmptyKind | null;
	requestId: number;
}

interface IPagesActions {
	/**
	 * Loads the list for the URL's filters. `clientCount` tells an empty account from an
	 * empty search, which the empty state needs.
	 */
	fetchPages: (query: IPageListQuery, clientCount: number) => Promise<void>;
	/** After a crawl finishes: keeps the rows on screen, and a failure stays silent. */
	refreshPages: (query: IPageListQuery, clientCount: number) => Promise<void>;
	reset: () => void;
}

export type IPagesViewModel = IPagesState & IPagesActions;

const initialState: IPagesState = {
	items: [],
	total: 0,
	page: 1,
	pageSize: 20,
	status: "idle",
	error: null,
	emptyKind: null,
	requestId: 0,
};

export const usePagesViewModel = create<IPagesViewModel>()((set, get) => {
	const load = async (query: IPageListQuery, clientCount: number, silent: boolean) => {
		const requestId = get().requestId + 1;
		set(silent ? { requestId } : { requestId, status: "loading", error: null });
		try {
			const response = await gateways.pages.list(query);
			if (get().requestId !== requestId) return;
			set({
				items: response.items,
				total: response.total,
				page: response.page,
				pageSize: response.pageSize,
				status: "ready",
				error: null,
				emptyKind: toEmptyKind(response.total, query, clientCount),
			});
		} catch (error: unknown) {
			if (get().requestId !== requestId || silent) return;
			set({ status: "error", error: describeError(error) });
		}
	};

	return {
		...initialState,
		fetchPages: (query, clientCount) => load(query, clientCount, false),
		refreshPages: (query, clientCount) => load(query, clientCount, true),
		reset: () => set(initialState),
	};
});

registerUserStoreReset(() => usePagesViewModel.getState().reset());
