import { describe, expect, it } from "vitest";
import { signInSearchSchema } from "./signInSearchSchema";

describe("signInSearchSchema", () => {
	it("keeps a string redirect and drops anything else", () => {
		expect(signInSearchSchema.parse({ redirect: "/pages" })).toEqual({ redirect: "/pages" });
		expect(signInSearchSchema.parse({ redirect: 42 })).toEqual({ redirect: undefined });
		expect(signInSearchSchema.parse({})).toEqual({});
	});
});
