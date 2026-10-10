import { describe, expect, it } from "vitest";
import { onPage, siteCheck, speedOnPage, wholeSite } from "../_Testing/reportRows";
import { filterReport } from "./filterReport";

const ALL_LEVELS = ["error", "warning", "notice"] as const;
const ROWS = [
	onPage("H1_MISSING", 1),
	onPage("LANG_MISSING", 2, "notice"),
	speedOnPage(2),
	wholeSite(15),
	siteCheck(),
];

describe("filterReport", () => {
	it("keeps only the chosen levels", () => {
		const rows = filterReport(ROWS, { levels: ["error"], type: "all" });

		expect(rows.map(({ code }) => code)).toEqual(["H1_MISSING"]);
	});

	it("keeps only the chosen type", () => {
		const rows = filterReport(ROWS, { levels: ALL_LEVELS, type: "speed" });

		expect(rows.map(({ code }) => code)).toEqual(["CWV_LCP_POOR", "CWV_INP_NEEDS_IMPROVEMENT"]);
	});

	it("a page filter keeps site and whole-site rows", () => {
		const rows = filterReport(ROWS, { levels: ALL_LEVELS, type: "all", pageId: 1 });

		expect(rows.map(({ code }) => code)).toEqual([
			"H1_MISSING",
			"CWV_INP_NEEDS_IMPROVEMENT",
			"SOFT_404",
		]);
	});

	it("searches page URLs and titles, case-insensitively, keeping whole-site rows", () => {
		const rows = filterReport(ROWS, { levels: ALL_LEVELS, type: "all", query: "POST-2" });

		expect(rows.map(({ code }) => code)).toEqual([
			"LANG_MISSING",
			"CWV_LCP_POOR",
			"CWV_INP_NEEDS_IMPROVEMENT",
			"SOFT_404",
		]);
	});
});
