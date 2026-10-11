import { describe, expect, it } from "vitest";
import { issuesSearchSchema } from "./issuesSearchSchema";

describe("issuesSearchSchema", () => {
	it("defaults to grouping by issue, every level, every type", () => {
		expect(issuesSearchSchema.parse({})).toEqual({
			group: "issue",
			levels: ["error", "warning", "notice"],
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
		).toEqual({ group: "issue", levels: ["error", "warning", "notice"], type: "all" });
	});

	it("lets the reader narrow the levels", () => {
		expect(issuesSearchSchema.parse({ levels: ["error"] }).levels).toEqual(["error"]);
	});
});
