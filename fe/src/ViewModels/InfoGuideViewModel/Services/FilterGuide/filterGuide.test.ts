import { describe, expect, it } from "vitest";
import { buildCheckGuide } from "../BuildCheckGuide/buildCheckGuide";
import { filterGuide } from "./filterGuide";

const ALL = buildCheckGuide();
const codesOf = (topics: ReturnType<typeof buildCheckGuide>) =>
	topics.flatMap((topic) => topic.entries.map((entry) => entry.code));

describe("filterGuide", () => {
	it("keeps everything without a search", () => {
		expect(filterGuide(ALL, undefined)).toBe(ALL);
		expect(filterGuide(ALL, "   ")).toBe(ALL);
	});

	it("opens exactly one check for its code, in any case", () => {
		expect(codesOf(filterGuide(ALL, "canonical_to_http"))).toEqual(["CANONICAL_TO_HTTP"]);
		expect(codesOf(filterGuide(ALL, " CANONICAL_TO_HTTP "))).toEqual(["CANONICAL_TO_HTTP"]);
	});

	it("finds a check by the words of its code, with every check that names them", () => {
		// CANONICAL_MISMATCH names CANONICAL_TO_HTTP in its own explanation, so it is found too.
		expect(codesOf(filterGuide(ALL, "Canonical to HTTP"))).toEqual(
			expect.arrayContaining(["CANONICAL_TO_HTTP", "CANONICAL_MISMATCH"]),
		);
	});

	it("requires every word, and drops a chapter left empty", () => {
		const topics = filterGuide(ALL, "alt screen reader");
		expect(codesOf(topics)).toContain("IMAGES_MISSING_ALT");
		expect(topics.every((topic) => topic.entries.length > 0)).toBe(true);
		expect(topics.map((topic) => topic.id)).not.toContain("siteSitemap");
	});

	it("matches nothing for a word no check uses", () => {
		expect(filterGuide(ALL, "zzzz-no-such-word")).toEqual([]);
	});
});
