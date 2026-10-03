import { afterEach, describe, expect, it, vi } from "vitest";
import { PageGateway } from "./PageGateway";

const ITEM = {
	id: 42,
	url: "https://yoast.com/how-to-remove-www-from-your-url/",
	title: "How to remove www from your URL • Yoast",
	client: { id: 7, name: "Yoast" },
	keywords: [
		{
			keywordId: 1,
			term: "remove www",
			relevance: 1,
			latestPosition: 4,
			latestCapturedAt: "2026-10-03T12:00:00.000Z",
		},
	],
	bestPosition: {
		position: 4,
		keywordId: 1,
		term: "remove www",
		capturedAt: "2026-10-03T12:00:00.000Z",
	},
	score: { value: 94, applicable: 18, failed: 1 },
	issues: { total: 1, error: 0, warning: 1, notice: 0, siteWide: 0 },
	lastCapturedAt: "2026-10-03T12:00:00.000Z",
};

const answer = (body: unknown) =>
	vi
		.spyOn(globalThis, "fetch")
		.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

afterEach(() => {
	vi.restoreAllMocks();
});

describe("PageGateway", () => {
	it("lists with only the filters that are set", async () => {
		const fetchSpy = answer({ items: [ITEM], page: 2, pageSize: 20, total: 21 });

		const response = await new PageGateway().list({ page: 2, pageSize: 20, clientId: 7 });

		expect(fetchSpy.mock.calls[0][0]).toBe("/api/pages?page=2&pageSize=20&clientId=7");
		expect(response.items[0]).toEqual(ITEM);
	});

	it("rejects an issue code the catalogue does not have", async () => {
		answer({
			page: { id: 42 },
			issues: [{ code: "MADE_UP", severity: "error", details: {} }],
		});

		await expect(new PageGateway().get(42)).rejects.toMatchObject({ name: "ZodError" });
	});

	it("asks for positions by calendar days", async () => {
		const fetchSpy = answer({
			from: "2026-09-04",
			to: "2026-10-03",
			timeZone: "America/Toronto",
			series: [],
		});

		await new PageGateway().positions(42, "2026-09-04", "2026-10-03");

		expect(fetchSpy.mock.calls[0][0]).toBe(
			"/api/pages/42/positions?from=2026-09-04&to=2026-10-03",
		);
	});
});
