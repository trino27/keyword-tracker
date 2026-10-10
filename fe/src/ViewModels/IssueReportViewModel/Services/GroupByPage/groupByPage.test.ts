import { describe, expect, it } from "vitest";
import { onPage, siteCheck, speedOnPage, wholeSite } from "../_Testing/reportRows";
import { groupByPage } from "./groupByPage";

describe("groupByPage", () => {
	it("leads with the whole-site rows", () => {
		const view = groupByPage([onPage("H1_MISSING", 1), wholeSite(15), siteCheck()]);

		expect(view.wholeSite.map(({ code }) => code)).toEqual([
			"SOFT_404",
			"CWV_INP_NEEDS_IMPROVEMENT",
		]);
		expect(view.pages.map(({ page }) => page.id)).toEqual([1]);
	});

	it("orders pages by their Critical, then Important, then Improvement counts", () => {
		const view = groupByPage([
			onPage("LANG_MISSING", 1, "notice"),
			speedOnPage(2),
			onPage("H1_MISSING", 3),
			onPage("LANG_MISSING", 2, "notice"),
		]);

		expect(view.pages.map(({ page }) => page.id)).toEqual([3, 2, 1]);
		expect(view.pages[1].counts).toEqual({ error: 0, warning: 1, notice: 1 });
	});

	it("lists a page's own rows worst first", () => {
		const view = groupByPage([onPage("LANG_MISSING", 1, "notice"), onPage("H1_MISSING", 1)]);

		expect(view.pages[0].rows.map(({ code }) => code)).toEqual(["H1_MISSING", "LANG_MISSING"]);
	});
});
