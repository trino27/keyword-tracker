import { describe, expect, it } from "vitest";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { hasActiveRun } from "./hasActiveRun";

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

describe("hasActiveRun", () => {
	it("is true while any run is queued or running", () => {
		expect(hasActiveRun([client({}), client({ latestRun: run("running") })])).toBe(true);
		expect(hasActiveRun([client({ latestRun: run("queued") })])).toBe(true);
		expect(hasActiveRun([client({}), client({ latestRun: null })])).toBe(false);
	});
});
