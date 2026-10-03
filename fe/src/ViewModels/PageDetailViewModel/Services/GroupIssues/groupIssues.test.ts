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
});
