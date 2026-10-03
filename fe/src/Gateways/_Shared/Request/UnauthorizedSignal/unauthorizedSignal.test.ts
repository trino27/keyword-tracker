import { describe, expect, it, vi } from "vitest";
import { notifyUnauthorized, onUnauthorized } from "./unauthorizedSignal";

describe("unauthorizedSignal", () => {
	it("calls every listener until it unsubscribes", () => {
		const listener = vi.fn();
		const unsubscribe = onUnauthorized(listener);

		notifyUnauthorized();
		unsubscribe();
		notifyUnauthorized();

		expect(listener).toHaveBeenCalledTimes(1);
	});
});
