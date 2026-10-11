import { describe, expect, it } from "vitest";
import { infoSearchSchema } from "./infoSearchSchema";

describe("infoSearchSchema", () => {
	it("opens the whole guide by default", () => {
		expect(infoSearchSchema.parse({})).toEqual({});
	});

	it("keeps a trimmed search and drops an empty or malformed one", () => {
		expect(infoSearchSchema.parse({ q: "  canonical " })).toEqual({ q: "canonical" });
		expect(infoSearchSchema.parse({ q: "   " })).toEqual({ q: undefined });
		expect(infoSearchSchema.parse({ q: 42 })).toEqual({ q: undefined });
	});
});
