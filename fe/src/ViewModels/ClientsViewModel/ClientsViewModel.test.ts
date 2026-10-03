import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { CLIENTS_POLL_MS, useClientsViewModel } from "./ClientsViewModel";

const run = (status: TCrawlRunSummary["status"]): TCrawlRunSummary => ({
	id: 3,
	status,
	trigger: "user",
	pagesFound: 0,
	pagesDone: 0,
	errorCode: null,
	errorMessage: null,
	createdAt: "2026-10-03T12:00:00.000Z",
	startedAt: null,
	finishedAt: null,
});
const client = (overrides: Partial<TClient> = {}): TClient => ({
	id: 7,
	name: "Yoast",
	websiteUrl: "https://yoast.com",
	siteKey: "yoast.com",
	currentPageCount: 15,
	latestRun: run("succeeded"),
	createdAt: "2026-10-03T12:00:00.000Z",
	...overrides,
});

const vm = () => useClientsViewModel.getState();

beforeEach(() => {
	vi.restoreAllMocks();
	vm().reset();
});

afterEach(() => {
	vm().reset();
	vi.useRealTimers();
});

describe("ClientsViewModel", () => {
	it("loads the clients", async () => {
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([client()]);

		await vm().fetchClients();

		expect(vm()).toMatchObject({ status: "ready", clients: [client()] });
	});

	it("drops a superseded answer", async () => {
		let resolveFirst: (clients: TClient[]) => void = () => {};
		vi.spyOn(ClientGateway.prototype, "list")
			.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
			.mockResolvedValueOnce([client({ name: "Newer" })]);

		const first = vm().fetchClients();
		await vm().fetchClients();
		resolveFirst([client({ name: "Older" })]);
		await first;

		expect(vm().clients[0].name).toBe("Newer");
	});

	it("an 'already tracked' refusal points at the existing client and keeps the table", async () => {
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([client()]);
		vi.spyOn(ClientGateway.prototype, "create").mockResolvedValue({
			kind: "exists",
			message: "You already track this website",
		});
		await vm().fetchClients();

		const created = await vm().addClient({
			name: "Again",
			websiteUrl: "https://www.yoast.com/blog",
		});

		expect(created).toBeNull();
		expect(vm().websiteError).toEqual({
			message: "You already track this website",
			existingClientId: 7,
		});
		expect(vm().clients).toHaveLength(1);
	});

	it("a network failure on add is a form-level error", async () => {
		vi.spyOn(ClientGateway.prototype, "create").mockRejectedValue(new Error("Could not reach"));

		await vm().addClient({ name: "x", websiteUrl: "x.example" });

		expect(vm()).toMatchObject({ actionError: "Could not reach", websiteError: null });
	});

	it("polls only while a run is active, and stops by itself", async () => {
		vi.useFakeTimers();
		const list = vi
			.spyOn(ClientGateway.prototype, "list")
			.mockResolvedValueOnce([client({ latestRun: run("running") })])
			.mockResolvedValueOnce([client({ latestRun: run("running") })])
			.mockResolvedValue([client()]);
		await vm().fetchClients();

		vm().startPolling();
		await vi.advanceTimersByTimeAsync(CLIENTS_POLL_MS);
		await vi.advanceTimersByTimeAsync(CLIENTS_POLL_MS);
		await vi.advanceTimersByTimeAsync(CLIENTS_POLL_MS * 5);

		expect(list).toHaveBeenCalledTimes(3);
		expect(vm().clients[0].latestRun?.status).toBe("succeeded");
	});

	it("stopPolling stops it", async () => {
		vi.useFakeTimers();
		const list = vi
			.spyOn(ClientGateway.prototype, "list")
			.mockResolvedValue([client({ latestRun: run("running") })]);
		await vm().fetchClients();

		vm().startPolling();
		vm().stopPolling();
		await vi.advanceTimersByTimeAsync(CLIENTS_POLL_MS * 3);

		expect(list).toHaveBeenCalledTimes(1);
	});

	it("a refused re-crawl is shown on its row", async () => {
		vi.spyOn(ClientGateway.prototype, "recrawl").mockResolvedValue({ kind: "active" });
		vi.spyOn(ClientGateway.prototype, "list").mockResolvedValue([client()]);

		await vm().recrawl(7);

		expect(vm().rowErrors[7]).toBe("A crawl of this website is already running");
	});
});
