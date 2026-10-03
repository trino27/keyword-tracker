import { beforeEach, describe, expect, it, vi } from "vitest";
import { notifyUnauthorized } from "@Gateways/_Shared/Request/UnauthorizedSignal/unauthorizedSignal";
import { SessionGateway } from "@Gateways/SessionGateway/SessionGateway";
import {
	listenForExpiredSession,
	registerUserStoreReset,
	useSessionViewModel,
} from "./SessionViewModel";

const USER = { id: 1, email: "yoast.manager@example.com", timeZone: "America/Toronto" };

beforeEach(() => {
	vi.restoreAllMocks();
	useSessionViewModel.getState().reset();
});

describe("SessionViewModel", () => {
	it("shares one in-flight session check between concurrent callers", async () => {
		const me = vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue(USER);

		const [a, b] = await Promise.all([
			useSessionViewModel.getState().fetchSession(),
			useSessionViewModel.getState().fetchSession(),
		]);

		expect(me).toHaveBeenCalledTimes(1);
		expect(a).toEqual(USER);
		expect(b).toEqual(USER);
		expect(useSessionViewModel.getState().status).toBe("signedIn");
	});

	it("knows a signed-out visitor without asking twice", async () => {
		const me = vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue(null);

		await useSessionViewModel.getState().fetchSession();
		await useSessionViewModel.getState().fetchSession();

		expect(me).toHaveBeenCalledTimes(1);
		expect(useSessionViewModel.getState().status).toBe("signedOut");
	});

	it("a refused sign-in keeps the user out and says why", async () => {
		vi.spyOn(SessionGateway.prototype, "login").mockResolvedValue({ kind: "invalid" });

		const ok = await useSessionViewModel.getState().signIn(USER.email, "wrong");

		expect(ok).toBe(false);
		expect(useSessionViewModel.getState()).toMatchObject({
			user: null,
			submitting: false,
			actionError: "Email or password is incorrect",
		});
	});

	it("signing out clears every registered user store", async () => {
		vi.spyOn(SessionGateway.prototype, "login").mockResolvedValue({
			kind: "signedIn",
			user: USER,
		});
		vi.spyOn(SessionGateway.prototype, "logout").mockResolvedValue();
		const resetClients = vi.fn();
		registerUserStoreReset(resetClients);
		await useSessionViewModel.getState().signIn(USER.email, "right");
		resetClients.mockClear();

		await useSessionViewModel.getState().signOut();

		expect(resetClients).toHaveBeenCalledTimes(1);
		expect(useSessionViewModel.getState()).toMatchObject({ user: null, status: "signedOut" });
	});

	it("a 401 elsewhere signs the user out and calls the router back", async () => {
		vi.spyOn(SessionGateway.prototype, "login").mockResolvedValue({
			kind: "signedIn",
			user: USER,
		});
		await useSessionViewModel.getState().signIn(USER.email, "right");
		const onExpired = vi.fn();
		const unsubscribe = listenForExpiredSession(onExpired);

		notifyUnauthorized();
		notifyUnauthorized();
		unsubscribe();

		expect(onExpired).toHaveBeenCalledTimes(1);
		expect(useSessionViewModel.getState().status).toBe("signedOut");
	});
});
