import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageGateway } from "@Gateways/PageGateway/PageGateway";
import type { TPageListResponse } from "@Gateways/PageGateway/Validation/PageSchemas";
import { usePagesViewModel } from "./PagesViewModel";

const response = (total: number): TPageListResponse => ({
	items: [],
	page: 1,
	pageSize: 20,
	total,
});
const QUERY = { page: 1, pageSize: 20 };
const vm = () => usePagesViewModel.getState();

beforeEach(() => {
	vi.restoreAllMocks();
	vm().reset();
});

describe("PagesViewModel", () => {
	it("knows why the list is empty", async () => {
		vi.spyOn(PageGateway.prototype, "list").mockResolvedValue(response(0));

		await vm().fetchPages({ ...QUERY, q: "zzz" }, 2);

		expect(vm()).toMatchObject({ status: "ready", emptyKind: "noMatches" });
	});

	it("drops a superseded answer", async () => {
		let resolveFirst: (value: TPageListResponse) => void = () => {};
		vi.spyOn(PageGateway.prototype, "list")
			.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce(response(5));

		const first = vm().fetchPages(QUERY, 1);
		await vm().fetchPages({ ...QUERY, page: 2 }, 1);
		resolveFirst(response(99));
		await first;

		expect(vm().total).toBe(5);
	});

	it("a failed refresh keeps the rows and says nothing", async () => {
		vi.spyOn(PageGateway.prototype, "list")
			.mockResolvedValueOnce(response(5))
			.mockRejectedValueOnce(new Error("offline"));
		await vm().fetchPages(QUERY, 1);

		await vm().refreshPages(QUERY, 1);

		expect(vm()).toMatchObject({ status: "ready", total: 5, error: null });
	});

	it("a failed load shows the reason", async () => {
		vi.spyOn(PageGateway.prototype, "list").mockRejectedValue(new Error("offline"));

		await vm().fetchPages(QUERY, 1);

		expect(vm()).toMatchObject({ status: "error", error: "offline" });
	});
});
