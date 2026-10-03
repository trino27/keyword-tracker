import { describe, expect, it } from "vitest";
import type { TClient, TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { findClientBySiteKey } from "./findClientBySiteKey";

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

describe("findClientBySiteKey", () => {
	it("finds the client by the same-site rule", () => {
		const yoast = client({});

		expect(findClientBySiteKey([yoast], "https://www.yoast.com/blog")).toBe(yoast);
		expect(findClientBySiteKey([yoast], "de.yoast.com")).toBeNull();
		expect(findClientBySiteKey([yoast], "not a url")).toBeNull();
	});
});
