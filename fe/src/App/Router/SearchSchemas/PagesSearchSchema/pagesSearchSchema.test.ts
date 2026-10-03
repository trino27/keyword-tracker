import { describe, expect, it } from "vitest";
import { pagesSearchSchema } from "./pagesSearchSchema";

describe("pagesSearchSchema", () => {
	it("defaults to the first page of 20", () => {
		expect(pagesSearchSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
	});

	it("reads numbers from the URL", () => {
		expect(
			pagesSearchSchema.parse({ clientId: "7", page: "3", pageSize: "50", q: " seo " }),
		).toEqual({ clientId: 7, page: 3, pageSize: 50, q: "seo" });
	});

	it("falls back on malformed values instead of failing", () => {
		expect(
			pagesSearchSchema.parse({ clientId: "abc", page: "abc", pageSize: "999", q: "   " }),
		).toEqual({ clientId: undefined, page: 1, pageSize: 20, q: undefined });
	});
});
