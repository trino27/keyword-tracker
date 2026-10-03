import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError } from "../Errors/ApiError/ApiError";
import { onUnauthorized } from "../Request/UnauthorizedSignal/unauthorizedSignal";
import { ABaseGateway } from "./ABaseGateway";

class ProbeGateway extends ABaseGateway {
	constructor() {
		super("/probe");
	}

	public get(quietOn401 = false) {
		return this.request("", z.object({ ok: z.boolean() }), undefined, {
			notifyUnauthorized: !quietOn401,
		});
	}
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("ABaseGateway", () => {
	it("announces a 401 as an expired session, then throws it", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ errorCode: "SESSION_REQUIRED", message: "Sign in" }), {
				status: 401,
			}),
		);
		const listener = vi.fn();
		const unsubscribe = onUnauthorized(listener);

		await expect(new ProbeGateway().get()).rejects.toBeInstanceOf(ApiError);
		await expect(new ProbeGateway().get(true)).rejects.toBeInstanceOf(ApiError);
		unsubscribe();

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("rejects a response the schema does not describe", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(JSON.stringify({ ok: "yes" }), { status: 200 }),
		);

		await expect(new ProbeGateway().get()).rejects.toMatchObject({ name: "ZodError" });
	});
});
