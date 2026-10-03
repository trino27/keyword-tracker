import { createMemoryHistory } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionGateway } from "@Gateways/SessionGateway/SessionGateway";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";
import { createAppRouter } from "./router";

const at = async (path: string) => {
	const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
	await router.load();
	return router.state.location;
};

beforeEach(() => {
	vi.restoreAllMocks();
	useSessionViewModel.getState().reset();
});

describe("router guards", () => {
	it("a signed-out visit to /pages lands on sign-in, carrying where it was going", async () => {
		vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue(null);

		const location = await at("/pages?q=seo");

		expect(location.pathname).toBe("/sign-in");
		expect(location.search).toEqual({ redirect: "/pages?q=seo" });
	});

	it("a signed-in visit to /sign-in goes to the pages list", async () => {
		vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue({
			id: 1,
			email: "yoast.manager@example.com",
			timeZone: "America/Toronto",
		});

		await expect(at("/sign-in")).resolves.toMatchObject({ pathname: "/pages" });
	});

	it("/ redirects to /pages", async () => {
		vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue({
			id: 1,
			email: "yoast.manager@example.com",
			timeZone: "America/Toronto",
		});

		await expect(at("/")).resolves.toMatchObject({ pathname: "/pages" });
	});
});
