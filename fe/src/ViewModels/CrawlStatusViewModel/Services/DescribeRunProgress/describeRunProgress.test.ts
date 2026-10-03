import { describe, expect, it } from "vitest";
import type { TCrawlRunSummary } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { describeRunProgress } from "./describeRunProgress";

const run = (overrides: Partial<TCrawlRunSummary>): TCrawlRunSummary => ({
	id: 1,
	status: "running",
	trigger: "user",
	pagesFound: 940,
	pagesDone: 6,
	errorCode: null,
	errorMessage: null,
	createdAt: "2026-10-03T12:00:00.000Z",
	startedAt: "2026-10-03T12:00:01.000Z",
	finishedAt: null,
	...overrides,
});

describe("describeRunProgress", () => {
	it("counts crawled pages while running", () => {
		expect(describeRunProgress(run({}), "yoast.com")).toEqual({
			tone: "active",
			text: "Crawling yoast.com — 6 of 15 pages",
		});
	});

	it("says it is still discovering before the sitemap is chosen", () => {
		expect(describeRunProgress(run({ pagesFound: 0, pagesDone: 0 }), "yoast.com").text).toBe(
			"Looking for the blog sitemap of yoast.com…",
		);
	});

	it("explains a partial run", () => {
		expect(describeRunProgress(run({ status: "partial", pagesDone: 9 }), "a.example")).toEqual({
			tone: "partial",
			text: "Only 9 of 15 posts on a.example could be crawled; the run log says why for each one.",
		});
	});

	it("uses the catalogued sentence for a failure", () => {
		expect(
			describeRunProgress(
				run({ status: "failed", errorCode: "SITEMAP_NOT_FOUND" }),
				"a.example",
			),
		).toEqual({
			tone: "failed",
			text: "No sitemap found — checked robots.txt and the usual sitemap addresses.",
		});
	});
});
