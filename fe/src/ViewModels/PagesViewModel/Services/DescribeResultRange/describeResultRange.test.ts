import { describe, expect, it } from "vitest";
import { describeResultRange } from "./describeResultRange";

describe("describeResultRange", () => {
	it.each([
		[1, 20, 47, "Showing 1–20 of 47 pages"],
		[2, 20, 47, "Showing 21–40 of 47 pages"],
		[3, 20, 47, "Showing 41–47 of 47 pages"],
		[1, 20, 1, "Showing 1–1 of 1 page"],
		[1, 20, 0, "No pages"],
		[9, 20, 30, "30 pages"],
	])("page %d of size %d with %d rows → %s", (page, size, total, text) => {
		expect(describeResultRange(page, size, total)).toBe(text);
	});
});
