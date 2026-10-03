import { create } from "zustand";
import { describeError } from "@Core/Helpers/DescribeError/describeError";
import { gateways } from "@Gateways/gateways";
import { onUnauthorized } from "@Gateways/_Shared/Request/UnauthorizedSignal/unauthorizedSignal";
import type { TSessionUser } from "@Gateways/SessionGateway/Validation/SessionSchemas";

export type TSessionStatus = "unknown" | "checking" | "signedIn" | "signedOut";

const SIGN_IN_REFUSED = "Email or password is incorrect";
const SIGN_IN_THROTTLED = "Too many attempts. Try again in a minute.";

interface ISessionState {
	user: TSessionUser | null;
	status: TSessionStatus;
	submitting: boolean;
	/** Why the last sign-in did not succeed; shown on the form. */
	actionError: string | null;
}

interface ISessionActions {
	/** Asks the server once; concurrent callers (guards, screens) share the request. */
	fetchSession: () => Promise<TSessionUser | null>;
	signIn: (email: string, password: string) => Promise<boolean>;
	signOut: () => Promise<void>;
	/** The server said the session is gone (a 401 elsewhere): forget the user locally. */
	applySignedOut: () => void;
	clearActionError: () => void;
	reset: () => void;
}

export type ISessionViewModel = ISessionState & ISessionActions;

const initialState: ISessionState = {
	user: null,
	status: "unknown",
	submitting: false,
	actionError: null,
};

/** Stores holding a signed-in user's data; each registers its reset at creation. */
const userStoreResets = new Set<() => void>();

/** Called by every store that holds one user's data, so signing out clears it. */
export function registerUserStoreReset(reset: () => void): void {
	userStoreResets.add(reset);
}

const resetUserStores = () => {
	for (const reset of userStoreResets) reset();
};

export const useSessionViewModel = create<ISessionViewModel>()((set, get) => {
	let inFlight: Promise<TSessionUser | null> | null = null;

	return {
		...initialState,

		fetchSession: () => {
			const { status, user } = get();
			if (status === "signedIn" || status === "signedOut") return Promise.resolve(user);
			if (inFlight) return inFlight;
			set({ status: "checking" });
			inFlight = gateways.session
				.me()
				.then((me) => {
					set({ user: me, status: me ? "signedIn" : "signedOut" });
					return me;
				})
				.catch((error: unknown) => {
					set({ status: "unknown" });
					throw error;
				})
				.finally(() => {
					inFlight = null;
				});
			return inFlight;
		},

		signIn: async (email, password) => {
			set({ submitting: true, actionError: null });
			try {
				const result = await gateways.session.login({ email, password });
				if (result.kind === "signedIn") {
					resetUserStores();
					set({ user: result.user, status: "signedIn", submitting: false });
					return true;
				}
				set({
					submitting: false,
					actionError: result.kind === "invalid" ? SIGN_IN_REFUSED : SIGN_IN_THROTTLED,
				});
				return false;
			} catch (error: unknown) {
				set({ submitting: false, actionError: describeError(error) });
				return false;
			}
		},

		signOut: async () => {
			try {
				await gateways.session.logout();
			} catch {
				// Signing out locally is what matters; the server session expires on its own.
			}
			get().applySignedOut();
		},

		applySignedOut: () => {
			inFlight = null;
			resetUserStores();
			set({ ...initialState, status: "signedOut" });
		},

		clearActionError: () => set({ actionError: null }),

		reset: () => {
			inFlight = null;
			set(initialState);
		},
	};
});

/**
 * Wires "a request came back 401" to "the user is signed out", then lets the caller —
 * the router — send them to the sign-in screen. Returns the unsubscribe.
 */
export function listenForExpiredSession(onExpired: () => void): () => void {
	return onUnauthorized(() => {
		if (useSessionViewModel.getState().status !== "signedIn") return;
		useSessionViewModel.getState().applySignedOut();
		onExpired();
	});
}
