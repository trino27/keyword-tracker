import { create } from "zustand";
import type { ICreateClientRequest } from "@app/contracts";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { gateways } from "@Gateways/gateways";
import type { TClient, TCrawlRunDetail } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { registerUserStoreReset } from "../SessionViewModel/SessionViewModel";
import { findClientBySiteKey } from "./Services/FindClientBySiteKey/findClientBySiteKey";
import { hasActiveRun } from "./Services/HasActiveRun/hasActiveRun";

export const CLIENTS_POLL_MS = 2_000;

export type TLoadStatus = "idle" | "loading" | "ready" | "error";

export interface IWebsiteFieldError {
	message: string;
	/** Set on "already tracked": the client the user already has for this site. */
	existingClientId?: number;
}

export interface IRunLogEntry {
	status: TLoadStatus;
	run: TCrawlRunDetail | null;
	error: string | null;
}

interface IClientsState {
	clients: TClient[];
	status: TLoadStatus;
	/** Why the list could not be read; the table shows it. */
	error: string | null;
	submitting: boolean;
	/** Why adding did not work when no field is to blame (network, 5xx). */
	actionError: string | null;
	websiteError: IWebsiteFieldError | null;
	/** A refused re-crawl, per client row. */
	rowErrors: Record<number, string>;
	runLogs: Record<number, IRunLogEntry>;
	requestId: number;
}

interface IClientsActions {
	fetchClients: () => Promise<void>;
	/** Like fetchClients, but keeps the table and swallows a failure — for polling. */
	refreshClients: () => Promise<void>;
	/** Resolves to the new client, or null when the form shows why not. */
	addClient: (request: ICreateClientRequest) => Promise<TClient | null>;
	recrawl: (clientId: number) => Promise<void>;
	/** Resolves true when the client is gone; a failure is shown on its row. */
	deleteClient: (clientId: number) => Promise<boolean>;
	fetchRunLog: (runId: number) => Promise<void>;
	/** Refreshes every 2 s while a run is queued or running, then stops by itself. */
	startPolling: () => void;
	stopPolling: () => void;
	clearFormErrors: () => void;
	reset: () => void;
}

export type IClientsViewModel = IClientsState & IClientsActions;

const initialState: IClientsState = {
	clients: [],
	status: "idle",
	error: null,
	submitting: false,
	actionError: null,
	websiteError: null,
	rowErrors: {},
	runLogs: {},
	requestId: 0,
};

export const useClientsViewModel = create<IClientsViewModel>()((set, get) => {
	let timer: ReturnType<typeof setInterval> | null = null;

	const stopPolling = () => {
		if (timer !== null) clearInterval(timer);
		timer = null;
	};

	const load = async (silent: boolean) => {
		const requestId = get().requestId + 1;
		set(silent ? { requestId } : { requestId, status: "loading", error: null });
		try {
			const clients = await gateways.clients.list();
			if (get().requestId !== requestId) return;
			set({ clients, status: "ready", error: null });
		} catch (error: unknown) {
			if (get().requestId !== requestId || silent) return;
			set({ status: "error", error: describeError(error) });
		}
	};

	return {
		...initialState,

		fetchClients: () => load(false),
		refreshClients: () => load(true),

		addClient: async (request) => {
			set({ submitting: true, actionError: null, websiteError: null });
			try {
				const result = await gateways.clients.create(request);
				if (result.kind === "created") {
					set({ submitting: false });
					await get().refreshClients();
					get().startPolling();
					return result.client;
				}
				const existing =
					result.kind === "exists"
						? findClientBySiteKey(get().clients, request.websiteUrl)
						: null;
				set({
					submitting: false,
					websiteError: { message: result.message, existingClientId: existing?.id },
				});
				return null;
			} catch (error: unknown) {
				set({ submitting: false, actionError: describeError(error) });
				return null;
			}
		},

		deleteClient: async (clientId) => {
			try {
				await gateways.clients.remove(clientId);
				const { [clientId]: _cleared, ...rowErrors } = get().rowErrors;
				set({
					clients: get().clients.filter((client) => client.id !== clientId),
					rowErrors,
				});
				return true;
			} catch (error: unknown) {
				set({ rowErrors: { ...get().rowErrors, [clientId]: describeError(error) } });
				return false;
			}
		},

		recrawl: async (clientId) => {
			const { [clientId]: _cleared, ...rowErrors } = get().rowErrors;
			set({ rowErrors });
			try {
				const result = await gateways.clients.recrawl(clientId);
				if (result.kind === "active") {
					set({
						rowErrors: {
							...get().rowErrors,
							[clientId]: "A crawl of this website is already running",
						},
					});
				}
				await get().refreshClients();
				get().startPolling();
			} catch (error: unknown) {
				set({ rowErrors: { ...get().rowErrors, [clientId]: describeError(error) } });
			}
		},

		fetchRunLog: async (runId) => {
			set({
				runLogs: {
					...get().runLogs,
					[runId]: {
						status: "loading",
						run: get().runLogs[runId]?.run ?? null,
						error: null,
					},
				},
			});
			try {
				const run = await gateways.clients.getRun(runId);
				set({
					runLogs: { ...get().runLogs, [runId]: { status: "ready", run, error: null } },
				});
			} catch (error: unknown) {
				set({
					runLogs: {
						...get().runLogs,
						[runId]: { status: "error", run: null, error: describeError(error) },
					},
				});
			}
		},

		startPolling: () => {
			if (timer !== null || !hasActiveRun(get().clients)) return;
			timer = setInterval(() => {
				if (!hasActiveRun(get().clients)) {
					stopPolling();
					return;
				}
				void get().refreshClients();
			}, CLIENTS_POLL_MS);
		},

		stopPolling,

		clearFormErrors: () => set({ actionError: null, websiteError: null }),

		reset: () => {
			stopPolling();
			set(initialState);
		},
	};
});

registerUserStoreReset(() => useClientsViewModel.getState().reset());
