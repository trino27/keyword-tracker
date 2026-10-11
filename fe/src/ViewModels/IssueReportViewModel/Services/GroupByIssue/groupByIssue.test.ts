import { describe, expect, it } from "vitest";
import { onPage, siteCheck, speedOnPage, wholeSite } from "../_Testing/reportRows";
import { groupByIssue, groupByIssueAcrossClients } from "./groupByIssue";

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

	it("a one-client card files its rows under no client", () => {
		const [group] = groupByIssue([onPage("H1_MISSING", 1), onPage("H1_MISSING", 2)], 15);

		expect(group.cards[0].clients).toEqual([
			{ client: null, affectedPages: 2, rows: group.cards[0].rows },
		]);
	});
});

const YOAST = { id: 7, name: "Yoast", site: "yoast.com" };
const AHREFS = { id: 8, name: "Ahrefs", site: "ahrefs.com" };

describe("groupByIssueAcrossClients", () => {
	it("makes one card per problem for every client, counting all their pages", () => {
		const [critical] = groupByIssueAcrossClients([
			{ client: YOAST, issues: [onPage("H1_MISSING", 1)], currentPages: 15 },
			{
				client: AHREFS,
				issues: [onPage("H1_MISSING", 2), onPage("H1_MISSING", 3)],
				currentPages: 10,
			},
		]);

		expect(critical.cards).toHaveLength(1);
		expect(critical.cards[0]).toMatchObject({ code: "H1_MISSING", affectedPages: 3 });
		expect(critical.cards[0].rows).toHaveLength(3);
	});

	it("groups a card's pages by client, the client with most pages first, then by name", () => {
		const [critical] = groupByIssueAcrossClients([
			{ client: YOAST, issues: [onPage("H1_MISSING", 1)], currentPages: 15 },
			{
				client: AHREFS,
				issues: [onPage("H1_MISSING", 2), onPage("H1_MISSING", 3)],
				currentPages: 10,
			},
			{
				client: { id: 9, name: "Backlinko", site: "backlinko.com" },
				issues: [onPage("H1_MISSING", 4)],
				currentPages: 10,
			},
		]);

		expect(
			critical.cards[0].clients.map(({ client, affectedPages }) => [
				client?.name,
				affectedPages,
			]),
		).toEqual([
			["Ahrefs", 2],
			["Backlinko", 1],
			["Yoast", 1],
		]);
	});

	/** A site check stands for each client's own crawl, not a shared one. */
	it("counts a site check by the crawl of the client it belongs to", () => {
		const [important] = groupByIssueAcrossClients([
			{ client: YOAST, issues: [siteCheck()], currentPages: 15 },
			{ client: AHREFS, issues: [siteCheck()], currentPages: 4 },
		]);

		expect(important.cards[0].affectedPages).toBe(19);
		expect(important.cards[0].clients.map(({ affectedPages }) => affectedPages)).toEqual([
			15, 4,
		]);
	});

	it("leaves out a client with nothing for the problem", () => {
		const groups = groupByIssueAcrossClients([
			{ client: YOAST, issues: [onPage("H1_MISSING", 1)], currentPages: 15 },
			{ client: AHREFS, issues: [], currentPages: 10 },
		]);

		expect(groups[0].cards[0].clients.map(({ client }) => client?.id)).toEqual([7]);
	});
});
