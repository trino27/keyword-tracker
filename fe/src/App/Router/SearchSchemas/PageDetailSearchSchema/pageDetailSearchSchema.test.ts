import { describe, expect, it } from "vitest";
import { pageDetailSearchSchema } from "./pageDetailSearchSchema";

describe("pageDetailSearchSchema", () => {
	it("defaults to the last 30 days as a chart", () => {
		expect(pageDetailSearchSchema.parse({})).toEqual({ range: "30d", view: "chart" });
	});

	it("keeps a custom range of real days", () => {
		expect(
			pageDetailSearchSchema.parse({ range: "custom", from: "2026-09-01", to: "2026-09-30" }),
		).toMatchObject({ range: "custom", from: "2026-09-01", to: "2026-09-30" });
	});

	it("falls back on nonsense", () => {
		expect(
			pageDetailSearchSchema.parse({
				range: "5y",
				from: "2026-02-30",
				view: "pie",
				hidden: "x",
			}),
		).toEqual({ range: "30d", from: undefined, view: "chart", hidden: undefined });
	});
});
