import { describe, expect, it } from "vitest";
import { describeIssue } from "./describeIssue";

describe("describeIssue", () => {
	it("names a Lighthouse finding's audit and where its verdict came from", () => {
		expect(describeIssue("LH_COLOR_CONTRAST", {})).toBe(
			"Lighthouse's color-contrast audit failed in its lab run of this page on a phone.",
		);
	});

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

	it("tells a data-nosnippet wrapper from a robots rule", () => {
		expect(
			describeIssue("SNIPPET_RESTRICTED", { source: "markup", rule: "data-nosnippet" }),
		).toBe(
			"A data-nosnippet element holds most of the article, so Google can quote none of it.",
		);
		expect(describeIssue("SNIPPET_RESTRICTED", { source: "meta", rule: "nosnippet" })).toBe(
			'The robots meta tag says "nosnippet".',
		);
	});

	it("tells a missing large-preview rule from a cap", () => {
		expect(describeIssue("IMAGE_PREVIEW_NOT_LARGE", { rule: null })).toBe(
			"No robots rule allows Google a large image preview (max-image-preview:large).",
		);
		expect(
			describeIssue("IMAGE_PREVIEW_NOT_LARGE", { rule: "max-image-preview:standard" }),
		).toBe('The robots rules cap the image preview with "max-image-preview:standard".');
	});

	it("reads the measured width of the preview image", () => {
		expect(describeIssue("PREVIEW_IMAGE_TOO_SMALL", { value: 683, min: 1200 })).toBe(
			"The page's own image is 683 px wide; Discover asks for at least 1200 px.",
		);
	});

	it("names the addresses a canonical or sharing tag points to", () => {
		expect(describeIssue("CANONICAL_TO_HTTP", { canonical: "http://a.example/post/" })).toBe(
			"The canonical names http://a.example/post/, the insecure address.",
		);
		expect(
			describeIssue("OG_URL_MISMATCH", {
				ogUrl: "https://a.example/?utm=x",
				expected: "https://a.example/post/",
			}),
		).toBe(
			"og:url names https://a.example/?utm=x; the page's address is https://a.example/post/.",
		);
	});

	it("renders an old HREFLANG_INVALID finding that still carries selfReferenced", () => {
		expect(
			describeIssue("HREFLANG_INVALID", {
				invalid: [],
				selfReferenced: false,
				canonicalElsewhere: null,
			}),
		).toBe("The hreflang set is ignored — the alternates never name this page.");
		expect(describeIssue("HREFLANG_NO_SELF_REFERENCE", { alternates: 3 })).toBe(
			"None of the 3 hreflang alternates names this page.",
		);
	});

	it("names the past year a title still sells", () => {
		expect(describeIssue("TITLE_YEAR_OUTDATED", { year: 2025, currentYear: 2026 })).toBe(
			"The title names 2025 as current; it is 2026.",
		);
	});

	it("says what a missing breadcrumb or repeated description is", () => {
		expect(describeIssue("BREADCRUMB_MISSING", {})).toBe(
			"The page declares no BreadcrumbList.",
		);
		expect(
			describeIssue("META_DESCRIPTION_REPEATS_TITLE", { description: "How to build links." }),
		).toBe('The description "How to build links." only repeats the title.');
	});

	it("counts in the singular and the plural", () => {
		expect(describeIssue("ARTICLE_DATE_FORMAT_INVALID", { fields: ["datePublished"] })).toBe(
			"datePublished in the article markup is not ISO 8601 with a time zone.",
		);
		expect(describeIssue("BREADCRUMB_INVALID", { count: 2 })).toBe(
			"2 breadcrumb steps lack a property Google requires.",
		);
		expect(describeIssue("AUTHOR_MARKUP_INCOMPLETE", { count: 1 })).toBe(
			"1 author entry falls short of Google's author best practices.",
		);
	});
});
