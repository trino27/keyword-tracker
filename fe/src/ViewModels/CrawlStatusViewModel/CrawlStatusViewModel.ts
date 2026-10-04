import { create } from "zustand";
import { ACTIVE_CRAWL_RUN_STATUSES } from "@app/contracts";
import { gateways } from "@Gateways/gateways";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";

export const CRAWL_STATUS_POLL_MS = 2_000;

const active: readonly string[] = ACTIVE_CRAWL_RUN_STATUSES;
const isActive = (client: TClient | null) =>
	client?.latestRun != null && active.includes(client.latestRun.status);

interface ICrawlStatusState {
	clientId: number | null;
	client: TClient | null;
	/**
	 * Bumped each time a run is SEEN to finish while this screen watches it — the
	 * screen reloads its list on a change, not on every poll.
	 */
	finishedCount: number;
}

interface ICrawlStatusActions {
	/** Reads the client once, then every 2 s while its run is queued or running. */
	startPolling: (clientId: number) => void;
	stopPolling: () => void;
	reset: () => void;
}

export type ICrawlStatusViewModel = ICrawlStatusState & ICrawlStatusActions;

const initialState: ICrawlStatusState = { clientId: null, client: null, finishedCount: 0 };

/** The pages list's banner: one client's latest crawl, followed live (D22). */
export const useCrawlStatusViewModel = create<ICrawlStatusViewModel>()((set, get) => {
	let timer: ReturnType<typeof setTimeout> | null = null;

	const clear = () => {
		if (timer !== null) clearTimeout(timer);
		timer = null;
	};

	const poll = async (clientId: number) => {
		try {
			const client = await gateways.clients.get(clientId);
			if (get().clientId !== clientId) return;
			const wasActive = isActive(get().client);
			set({
				client,
				finishedCount:
					wasActive && !isActive(client) ? get().finishedCount + 1 : get().finishedCount,
			});
			if (isActive(client))
				timer = setTimeout(() => void poll(clientId), CRAWL_STATUS_POLL_MS);
		} catch (error) {
			// Silent to the reader — the banner is a convenience and retries on the next
			// visit — but never silent to a developer with the console open.
			console.error("[CrawlStatusViewModel] poll failed", error);
		}
	};

	return {
		...initialState,

		startPolling: (clientId) => {
			clear();
			set({ clientId, client: get().clientId === clientId ? get().client : null });
			void poll(clientId);
		},

		stopPolling: () => {
			clear();
			set({ clientId: null });
		},

		reset: () => {
			clear();
			set(initialState);
		},
	};
});

registerUserStoreReset(() => useCrawlStatusViewModel.getState().reset());
