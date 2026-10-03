import { describe, expect, it } from "vitest";
import { groupIssues } from "./groupIssues";

describe("groupIssues", () => {
	it("groups by severity, errors first, with a sentence for each", () => {
		const groups = groupIssues([
			{ code: "LANG_MISSING", severity: "notice", details: {} },
			{
				code: "TITLE_LENGTH",
				severity: "warning",
				details: { length: 72, min: 30, max: 60 },
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

	it("describes the byte-size issue in kilobytes", () => {
		const [group] = groupIssues([
			{
				code: "LARGE_PAGE",
				severity: "notice",
				details: { bytes: 2_097_152, max: 1_048_576 },
			},
		]);

		expect(group.issues[0].detail).toBe("The HTML is 2048 KB; aim for under 1024 KB.");
	});
});
