import { describe, expect, it } from "vitest";
import { onPage, siteCheck, speedOnPage, wholeSite } from "../_Testing/reportRows";
import { groupByIssue } from "./groupByIssue";

describe("groupByIssue", () => {
	it("puts Critical first and leaves empty levels out", () => {
		const groups = groupByIssue([wholeSite(15), onPage("H1_MISSING", 1)], 15);

		expect(groups.map(({ severity }) => severity)).toEqual(["error", "notice"]);
	});

	it("shows each problem once, with every page it was found on", () => {
		const [group] = groupByIssue(
			[onPage("H1_MISSING", 1), onPage("H1_MISSING", 2), onPage("H1_MISSING", 3)],
			15,
		);

		expect(group.cards).toHaveLength(1);
		expect(group.cards[0]).toMatchObject({ code: "H1_MISSING", affectedPages: 3 });
		expect(group.cards[0].rows).toHaveLength(3);
	});

	/** D19: a whole-site row stands for its pages, so it is not filed last as "1". */
	it("orders a level by pages affected, a whole-site row counting its pages", () => {
		const [important] = groupByIssue([speedOnPage(1), speedOnPage(2), siteCheck()], 15);

		expect(important.cards.map(({ code, affectedPages }) => [code, affectedPages])).toEqual([
			["SOFT_404", 15],
			["CWV_LCP_POOR", 2],
		]);
	});

	it("marks a problem that belongs to the whole site", () => {
		const [notice] = groupByIssue([wholeSite(15)], 15);

		expect(notice.cards[0]).toMatchObject({ wholeSite: true, affectedPages: 15 });
	});

	it("breaks ties in catalogue order", () => {
		const [critical] = groupByIssue([onPage("H1_MISSING", 1), onPage("TITLE_MISSING", 2)], 15);

		expect(critical.cards.map(({ code }) => code)).toEqual(["TITLE_MISSING", "H1_MISSING"]);
	});
});
