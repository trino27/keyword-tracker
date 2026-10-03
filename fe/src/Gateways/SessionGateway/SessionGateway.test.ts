import { afterEach, describe, expect, it, vi } from "vitest";
import { onUnauthorized } from "../_Shared/Request/UnauthorizedSignal/unauthorizedSignal";
import { SessionGateway } from "./SessionGateway";

const USER = { id: 1, email: "yoast.manager@example.com", timeZone: "America/Toronto" };

const answer = (status: number, body?: unknown) =>
	vi
		.spyOn(globalThis, "fetch")
		.mockResolvedValue(
			new Response(body === undefined ? null : JSON.stringify(body), { status }),
		);

afterEach(() => {
	vi.restoreAllMocks();
});

describe("SessionGateway", () => {
	const gateway = new SessionGateway();

	it("signs in and returns the user", async () => {
		answer(200, { user: USER });

		await expect(gateway.login({ email: USER.email, password: "x" })).resolves.toEqual({
			kind: "signedIn",
			user: USER,
		});
	});

	it("a 401 on login is { kind: 'invalid' } and does not announce an expired session", async () => {
		answer(401, {
			errorCode: "INVALID_CREDENTIALS",
			message: "Email or password is incorrect",
		});
		const listener = vi.fn();
		const unsubscribe = onUnauthorized(listener);

		await expect(gateway.login({ email: USER.email, password: "x" })).resolves.toEqual({
			kind: "invalid",
		});
		unsubscribe();
		expect(listener).not.toHaveBeenCalled();
	});

	it("a 429 on login is { kind: 'throttled' }", async () => {
		answer(429, { errorCode: "TOO_MANY_REQUESTS", message: "Too many requests" });

		await expect(gateway.login({ email: USER.email, password: "x" })).resolves.toEqual({
			kind: "throttled",
		});
	});

	it("me is null without a session", async () => {
		answer(401, { errorCode: "SESSION_REQUIRED", message: "Sign in to continue" });

		await expect(gateway.me()).resolves.toBeNull();
	});

	it("sends credentials and JSON", async () => {
		const fetchSpy = answer(200, { user: USER });

		await gateway.login({ email: USER.email, password: "secret" });

		const [url, init] = fetchSpy.mock.calls[0];
		expect(url).toBe("/api/auth/login");
		expect(init?.credentials).toBe("include");
		expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
	});
});
