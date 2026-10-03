import { create } from "zustand";
import { gateways } from "@Gateways/gateways";
import type { THealth } from "@Gateways/HealthGateway/Validation/HealthSchemas";
import { describeError } from "@Core/Helpers/DescribeError/describeError";

/**
 * Whether the backend and its database answer — the end-to-end proof that the
 * browser, the reverse proxy, the API and Postgres are wired together.
 */
export type THealthStatus = "idle" | "loading" | "ready" | "error";

interface IHealthState {
	status: THealthStatus;
	health: THealth | null;
	error: string | null;
	/** Identity of the latest `load()`; an older answer arriving late is discarded. */
	requestId: number;
}

interface IHealthActions {
	load: () => Promise<void>;
}

export const useHealthViewModel = create<IHealthState & IHealthActions>()((set, get) => ({
	status: "idle",
	health: null,
	error: null,
	requestId: 0,

	load: async () => {
		const requestId = get().requestId + 1;
		set({ status: "loading", error: null, requestId });

		try {
			const health = await gateways.health.get();
			if (get().requestId !== requestId) return;
			set({ status: "ready", health });
		} catch (error: unknown) {
			if (get().requestId !== requestId) return;
			set({ status: "error", health: null, error: describeError(error) });
		}
	},
}));
