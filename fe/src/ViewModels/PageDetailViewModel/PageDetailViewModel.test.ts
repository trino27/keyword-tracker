import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@Gateways/_Shared/Errors/ApiError/ApiError";
import { PageGateway } from "@Gateways/PageGateway/PageGateway";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { usePageDetailViewModel } from "./PageDetailViewModel";

const history = (from: string): TPositionHistory => ({
	from: from as TPositionHistory["from"],
	to: "2026-10-02",
	timeZone: "America/Toronto",
	series: [],
});
const vm = () => usePageDetailViewModel.getState();

beforeEach(() => {
	vi.restoreAllMocks();
	vm().reset();
});

describe("PageDetailViewModel", () => {
	it("a 404 is 'not found', not an error", async () => {
		vi.spyOn(PageGateway.prototype, "get").mockRejectedValue(
			new ApiError(404, "PAGE_NOT_FOUND", "Page not found"),
		);

		await vm().fetchDetail(42);

		expect(vm()).toMatchObject({ notFound: true, detailError: null, detailStatus: "ready" });
	});

	it("another failure is shown as an error", async () => {
		vi.spyOn(PageGateway.prototype, "get").mockRejectedValue(new Error("offline"));

		await vm().fetchDetail(42);

		expect(vm()).toMatchObject({
			notFound: false,
			detailStatus: "error",
			detailError: "offline",
		});
	});

	it("when the range changes twice, only the last answer is kept", async () => {
		let resolveFirst: (value: TPositionHistory) => void = () => {};
		vi.spyOn(PageGateway.prototype, "positions")
			.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce(history("2026-09-26"));

		const first = vm().fetchHistory(42, { from: "2026-09-03", to: "2026-10-02" });
		await vm().fetchHistory(42, { from: "2026-09-26", to: "2026-10-02" });
		resolveFirst(history("2026-09-03"));
		await first;

		expect(vm().history?.from).toBe("2026-09-26");
	});
});
