import { describe, expect, it } from "vitest";
import { groupIssues } from "./groupIssues";

describe("groupIssues", () => {
	it("groups by severity, errors first, with a sentence for each", () => {
		const groups = groupIssues([
			{ code: "LANG_MISSING", severity: "notice", details: {} },
			{
				code: "TITLE_LENGTH",
				severity: "warning",
				details: { value: 72, min: 30, max: 60 },
			},
			{ code: "H1_MISSING", severity: "error", details: {} },
		]);

		expect(groups.map((group) => group.severity)).toEqual(["error", "warning", "notice"]);
		expect(groups[1].issues[0]).toMatchObject({
			label: "Title length",
			detail: "The title is 72 characters; aim for 30–60.",
		});
	});

	it("leaves out empty severities", () => {
		expect(groupIssues([])).toEqual([]);
	});

	it("reads a measured sentence from the bounds the crawl stored, not from today's catalogue", () => {
		const [group] = groupIssues([
			{
				code: "TITLE_LENGTH",
				severity: "notice",
				details: { value: 72, min: 20, max: 50 },
			},
		]);

		expect(group.issues[0].detail).toBe("The title is 72 characters; aim for 20–50.");
	});

	it("describes a thin page from its measurement", () => {
		const [group] = groupIssues([
			{ code: "THIN_CONTENT", severity: "warning", details: { value: 227, min: 300 } },
		]);

		expect(group.issues[0].detail).toBe("The content has 227 words; aim for at least 300.");
	});

	it("describes the byte-size issue in kilobytes", () => {
		const [group] = groupIssues([
			{
				code: "LARGE_PAGE",
				severity: "notice",
				details: { value: 2_097_152, max: 1_048_576 },
			},
		]);

		expect(group.issues[0].detail).toBe("The HTML is 2048 KB; aim for under 1024 KB.");
	});

	it("has a sentence for a page with no article markup", () => {
		const [group] = groupIssues([
			{
				code: "STRUCTURED_DATA_MISSING",
				severity: "notice",
				details: { types: ["Organization", "BreadcrumbList"] },
			},
		]);

		expect(group.issues[0]).toMatchObject({
			label: "No article structured data",
			detail: "The page declares Organization, BreadcrumbList, but no Article or BlogPosting.",
		});
	});

	it("says so when a page declares no structured data at all", () => {
		const [group] = groupIssues([
			{ code: "STRUCTURED_DATA_MISSING", severity: "notice", details: { types: [] } },
		]);

		expect(group.issues[0].detail).toBe("The page declares no structured data.");
	});

	it("hands the pages a run finding is about to the view as links, not as prose", () => {
		const [group] = groupIssues([
			{
				code: "KEYWORD_CANNIBALISATION",
				severity: "warning",
				details: {
					term: "ai marketing",
					otherUrls: ["https://a.example/guide/", "https://a.example/what/"],
				},
			},
		]);

		expect(group.issues[0]).toMatchObject({
			detail: '2 other pages lead with "ai marketing".',
			relatedUrls: ["https://a.example/guide/", "https://a.example/what/"],
		});
	});

	it("counts one other page in the singular", () => {
		const [group] = groupIssues([
			{
				code: "TITLE_DUPLICATE",
				severity: "warning",
				details: { otherUrls: ["https://a.example/b/"] },
			},
		]);

		expect(group.issues[0].detail).toBe("Another page uses the same title.");
	});

	it("gives a page's own finding no related pages", () => {
		const [group] = groupIssues([{ code: "H1_MISSING", severity: "error", details: {} }]);

		expect(group.issues[0].relatedUrls).toEqual([]);
	});

	it("names the meta tag a noindex came from", () => {
		const [group] = groupIssues([
			{
				code: "NOINDEX",
				severity: "error",
				details: { source: "meta", name: "googlebot", value: "none" },
			},
		]);

		expect(group.issues[0].detail).toBe('The googlebot meta tag says "none".');
	});

	it("says a redirect is temporary when one hop was", () => {
		const [group] = groupIssues([
			{
				code: "REDIRECTED",
				severity: "notice",
				details: {
					from: "https://a.example/a",
					to: "https://a.example/b",
					temporary: true,
				},
			},
		]);

		expect(group.issues[0].detail).toBe(
			"The sitemap lists https://a.example/a, which temporarily redirects to https://a.example/b.",
		);
	});

	it("quotes the robots.txt rule that blocks Googlebot", () => {
		const [group] = groupIssues([
			{
				code: "ROBOTS_BLOCKS_GOOGLEBOT",
				severity: "error",
				details: { url: "https://a.example/p/", rule: "line 5: Disallow: /p/" },
			},
		]);

		expect(group.issues[0].detail).toBe(
			"Googlebot may not fetch this page: robots.txt line 5: Disallow: /p/.",
		);
	});

	it("carries the evidence, the explanation and the sources to the view", () => {
		const [group] = groupIssues([
			{
				code: "HTML_NOT_COMPRESSED",
				severity: "notice",
				details: { encoding: null, evidence: ["Response: no Content-Encoding header"] },
			},
		]);

		expect(group.issues[0]).toMatchObject({
			detail: "The server sent the HTML uncompressed.",
			evidence: ["Response: no Content-Encoding header"],
			explanation: expect.stringContaining("Accept-Encoding"),
			sources: expect.arrayContaining([
				expect.objectContaining({ url: expect.stringMatching(/^https:\/\//) }),
			]),
		});
	});
});
