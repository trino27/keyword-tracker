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
		const codes = [...view.reference, ...view.lighthouse].flatMap((topic) =>
			topic.entries.map((entry) => entry.code),
		);
		expect(codes).toContain("NOINDEX");
		expect(view.matched).toBe(codes.length);
	});

	it("keeps Lighthouse's chapters apart from the check reference", () => {
		const view = guideViewOf(undefined);
		if (view.kind !== "all") throw new Error(view.kind);
		expect(view.reference.every((topic) => topic.part === "reference")).toBe(true);
		expect(view.lighthouse.map((topic) => topic.id)).toContain("a11yAria");
		expect(
			view.lighthouse.flatMap((t) => t.entries).every((e) => e.code.startsWith("LH_")),
		).toBe(true);
		expect(view.reference.flatMap((t) => t.entries).some((e) => e.code.startsWith("LH_"))).toBe(
			false,
		);
	});

	it("says when nothing matches", () => {
		expect(guideViewOf("zzzz-no-such-word")).toEqual({ kind: "noResults" });
	});
});
