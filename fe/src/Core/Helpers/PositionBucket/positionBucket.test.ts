import { describe, expect, it } from "vitest";
import { positionBucket } from "./positionBucket";

describe("positionBucket", () => {
	it.each([
		[1, "Top 3"],
		[3, "Top 3"],
		[4, "Top 10"],
		[10, "Top 10"],
		[11, "Top 20"],
		[20, "Top 20"],
		[21, "Below 20"],
		[100, "Below 20"],
		[null, "No position yet"],
	])("%s → %s", (position, label) => {
		expect(positionBucket(position).label).toBe(label);
	});
});
