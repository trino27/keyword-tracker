import { beforeEach, describe, expect, it, vi } from "vitest";
import { HealthGateway } from "@Gateways/HealthGateway/HealthGateway";
import { useHealthViewModel } from "./HealthViewModel";

/** Spied on the PROTOTYPE, so it holds for whichever instance the registry built. */
const spyOnGet = () => vi.spyOn(HealthGateway.prototype, "get");

beforeEach(() => {
	vi.restoreAllMocks();
	useHealthViewModel.setState(useHealthViewModel.getInitialState(), true);
});

describe("HealthViewModel", () => {
	it("stores the answer", async () => {
		spyOnGet().mockResolvedValue({ status: "ok", database: "up" });

		await useHealthViewModel.getState().load();

		const state = useHealthViewModel.getState();
		expect(state.status).toBe("ready");
		expect(state.health).toEqual({ status: "ok", database: "up" });
	});

	it("turns a failure into a sentence and drops the stale answer", async () => {
		spyOnGet().mockRejectedValue(new Error("Server error"));

		await useHealthViewModel.getState().load();

		const state = useHealthViewModel.getState();
		expect(state.status).toBe("error");
		expect(state.health).toBeNull();
		expect(state.error).toBe("Server error");
	});

	it("ignores an answer superseded by a newer load", async () => {
		let resolveFirst: (value: { status: "degraded"; database: "down" }) => void = () => {};
		spyOnGet()
			.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce({ status: "ok", database: "up" });

		const first = useHealthViewModel.getState().load();
		await useHealthViewModel.getState().load();
		resolveFirst({ status: "degraded", database: "down" });
		await first;

		expect(useHealthViewModel.getState().health).toEqual({ status: "ok", database: "up" });
	});
});
