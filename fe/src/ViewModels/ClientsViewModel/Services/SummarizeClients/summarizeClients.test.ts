import { describe, expect, it } from "vitest";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { summarizeClients } from "./summarizeClients";

const run = (status: TCrawlRunSummary["status"]): TCrawlRunSummary => ({
	id: 1,
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
const client = (overrides: Partial<TClient>): TClient => ({
	id: 1,
	name: "Yoast",
	websiteUrl: "https://yoast.com",
	siteKey: "yoast.com",
	currentPageCount: 15,
	latestRun: run("succeeded"),
	createdAt: "2026-10-03T12:00:00.000Z",
	...overrides,
});

describe("summarizeClients", () => {
	it("counts pages and clients in words", () => {
		expect(summarizeClients([client({}), client({ id: 2, currentPageCount: 1 })])).toBe(
			"16 pages across 2 clients",
		);
		expect(summarizeClients([client({ currentPageCount: 1 })])).toBe("1 page across 1 client");
		expect(summarizeClients([])).toBe("No clients yet");
	});
});
