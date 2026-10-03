import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientGateway } from "@Gateways/ClientGateway/ClientGateway";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { CRAWL_STATUS_POLL_MS, useCrawlStatusViewModel } from "./CrawlStatusViewModel";

const withRun = (status: TCrawlRunSummary["status"]): TClient => ({
	id: 7,
	name: "Yoast",
	websiteUrl: "https://yoast.com",
	siteKey: "yoast.com",
	currentPageCount: 0,
	latestRun: {
		id: 3,
		status,
		trigger: "user",
		pagesFound: 940,
		pagesDone: 6,
		errorCode: null,
		errorMessage: null,
		createdAt: "2026-10-03T12:00:00.000Z",
		startedAt: null,
		finishedAt: null,
	},
	createdAt: "2026-10-03T12:00:00.000Z",
});

const vm = () => useCrawlStatusViewModel.getState();

beforeEach(() => {
	vi.restoreAllMocks();
	vi.useFakeTimers();
	vm().reset();
});

afterEach(() => {
	vm().reset();
	vi.useRealTimers();
});

describe("CrawlStatusViewModel", () => {
	it("polls while the run is active and counts the finish it saw", async () => {
		const get = vi
			.spyOn(ClientGateway.prototype, "get")
			.mockResolvedValueOnce(withRun("queued"))
			.mockResolvedValueOnce(withRun("running"))
			.mockResolvedValue(withRun("succeeded"));

		vm().startPolling(7);
		await vi.advanceTimersByTimeAsync(0);
		await vi.advanceTimersByTimeAsync(CRAWL_STATUS_POLL_MS);
		await vi.advanceTimersByTimeAsync(CRAWL_STATUS_POLL_MS);
		await vi.advanceTimersByTimeAsync(CRAWL_STATUS_POLL_MS * 5);

		expect(get).toHaveBeenCalledTimes(3);
		expect(vm().client?.latestRun?.status).toBe("succeeded");
		expect(vm().finishedCount).toBe(1);
	});

	it("reads a finished client once and does not count it as a finish", async () => {
		const get = vi
			.spyOn(ClientGateway.prototype, "get")
			.mockResolvedValue(withRun("succeeded"));

		vm().startPolling(7);
		await vi.advanceTimersByTimeAsync(CRAWL_STATUS_POLL_MS * 3);

		expect(get).toHaveBeenCalledTimes(1);
		expect(vm().finishedCount).toBe(0);
	});

	it("stops on stopPolling", async () => {
		const get = vi.spyOn(ClientGateway.prototype, "get").mockResolvedValue(withRun("running"));

		vm().startPolling(7);
		await vi.advanceTimersByTimeAsync(0);
		vm().stopPolling();
		await vi.advanceTimersByTimeAsync(CRAWL_STATUS_POLL_MS * 3);

		expect(get).toHaveBeenCalledTimes(1);
	});
});
