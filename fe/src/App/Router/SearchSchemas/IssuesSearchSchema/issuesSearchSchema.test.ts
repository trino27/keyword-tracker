import { describe, expect, it } from "vitest";
import { issuesSearchSchema } from "./issuesSearchSchema";

describe("issuesSearchSchema", () => {
	it("defaults to grouping by issue, Critical and Important only, every type", () => {
		expect(issuesSearchSchema.parse({})).toEqual({
			group: "issue",
			levels: ["error", "warning"],
			type: "all",
		});
	});

	it("keeps a client and a page from the URL", () => {
		expect(issuesSearchSchema.parse({ clientId: "7", pageId: "42" })).toMatchObject({
			clientId: 7,
			pageId: 42,
		});
	});

	it("falls back to the defaults on malformed values", () => {
		expect(
			issuesSearchSchema.parse({
				clientId: "x",
				group: "nope",
				levels: ["fatal"],
				type: "everything",
			}),
		).toEqual({ group: "issue", levels: ["error", "warning"], type: "all" });
	});

	it("lets the reader show Improvements too", () => {
		expect(issuesSearchSchema.parse({ levels: ["error", "warning", "notice"] }).levels).toEqual(
			["error", "warning", "notice"],
		);
	});
});
