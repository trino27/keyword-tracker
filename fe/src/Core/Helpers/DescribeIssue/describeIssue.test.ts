import { describe, expect, it } from "vitest";
import { describeIssue } from "./describeIssue";

describe("describeIssue", () => {
	it("reads a measured sentence from the bounds the crawl stored", () => {
		expect(describeIssue("TITLE_LENGTH", { value: 72, min: 30, max: 60 })).toBe(
			"The title is 72 characters; aim for 30–60.",
		);
	});

	it("describes CWV_LCP_NEEDS_IMPROVEMENT from its stored bound and source", () => {
		expect(
			describeIssue("CWV_LCP_NEEDS_IMPROVEMENT", { value: 3100, max: 2500, source: "url" }),
		).toBe("LCP is 3.1 s for this page's real visitors; good is 2.5 s or less.");
	});

	it("says a poor value is over the poor bound", () => {
		expect(describeIssue("CWV_INP_POOR", { value: 640, max: 500, source: "origin" })).toBe(
			"INP is 640 ms for the whole site's real visitors; over 500 ms is poor.",
		);
	});

	it("names a lab value as one", () => {
		expect(
			describeIssue("CWV_CLS_NEEDS_IMPROVEMENT", { value: 0.18, max: 0.1, source: "lab" }),
		).toBe("CLS is 0.18 for a lab test, which may vary; good is 0.1 or less.");
	});
});
