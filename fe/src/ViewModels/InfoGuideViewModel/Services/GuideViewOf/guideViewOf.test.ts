import { describe, expect, it } from "vitest";
import { guideViewOf } from "./guideViewOf";

describe("guideViewOf", () => {
	it("shows the whole guide without a search", () => {
		expect(guideViewOf(undefined).kind).toBe("all");
	});

	it("shows only the matching checks, and how many, with a search", () => {
		const view = guideViewOf("noindex");
		expect(view.kind).toBe("results");
		if (view.kind !== "results") return;
		const codes = view.topics.flatMap((topic) => topic.entries.map((entry) => entry.code));
		expect(codes).toContain("NOINDEX");
		expect(view.matched).toBe(codes.length);
	});

	it("says when nothing matches", () => {
		expect(guideViewOf("zzzz-no-such-word")).toEqual({ kind: "noResults" });
	});
});
