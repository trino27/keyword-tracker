import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientGateway } from "./ClientGateway";

const RUN = {
	id: 3,
	status: "queued",
	trigger: "user",
	pagesFound: 0,
	pagesDone: 0,
	errorCode: null,
	errorMessage: null,
	createdAt: "2026-10-03T12:00:00.000Z",
	startedAt: null,
	finishedAt: null,
};
const CLIENT = {
	id: 7,
	name: "Yoast",
	websiteUrl: "https://yoast.com",
	siteKey: "yoast.com",
	currentPageCount: 0,
	latestRun: RUN,
	createdAt: "2026-10-03T12:00:00.000Z",
};

const answer = (status: number, body: unknown) =>
	vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
	vi.restoreAllMocks();
});

describe("ClientGateway", () => {
	const gateway = new ClientGateway();

	it("creates a client", async () => {
		answer(201, { client: CLIENT });

		await expect(gateway.create({ name: "Yoast", websiteUrl: "yoast.com" })).resolves.toEqual({
			kind: "created",
			client: CLIENT,
		});
	});

	it("a 409 duplicate is { kind: 'exists' }", async () => {
		answer(409, {
			errorCode: "CLIENT_ALREADY_EXISTS",
			message: "You already track this website",
		});

		await expect(gateway.create({ name: "Yoast", websiteUrl: "yoast.com" })).resolves.toEqual({
			kind: "exists",
			message: "You already track this website",
		});
	});

	it("a 400 INVALID_WEBSITE_URL is { kind: 'invalidUrl' }", async () => {
		answer(400, {
			errorCode: "INVALID_WEBSITE_URL",
			message: "Enter a public website address",
		});

		await expect(gateway.create({ name: "x", websiteUrl: "localhost" })).resolves.toMatchObject(
			{
				kind: "invalidUrl",
			},
		);
	});

	it("a re-crawl refused because one is running is { kind: 'active' }", async () => {
		answer(409, { errorCode: "CRAWL_ALREADY_ACTIVE", message: "A crawl is already running" });

		await expect(gateway.recrawl(7)).resolves.toEqual({ kind: "active" });
	});

	it("rejects a client whose run status the contract does not know", async () => {
		answer(200, { items: [{ ...CLIENT, latestRun: { ...RUN, status: "paused" } }] });

		await expect(gateway.list()).rejects.toMatchObject({ name: "ZodError" });
	});
});
