import { MantineProvider } from "@mantine/core";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppRouter } from "@App/Router/router";
import { SessionGateway } from "@Gateways/SessionGateway/SessionGateway";
import { useSessionViewModel } from "@ViewModels/SessionViewModel/SessionViewModel";

const renderAt = async (path: string) => {
	const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
	await router.load();
	render(
		<MantineProvider>
			<RouterProvider router={router} />
		</MantineProvider>,
	);
	return router;
};

const contents = () => screen.getByRole("navigation", { name: "Guide contents" });

beforeEach(() => {
	vi.restoreAllMocks();
	useSessionViewModel.getState().reset();
	vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue({
		id: 1,
		email: "yoast.manager@example.com",
		timeZone: "America/Toronto",
	});
});

/**
 * The guide is the largest screen in the app, and a role query walks every node of it:
 * alone the first test takes two to seven seconds, and under the parallel suite it passed 15.
 * Queries are scoped to the part under test, and the budget is set for the screen.
 */
describe("InfoScreen", { timeout: 30_000 }, () => {
	it("lays the guide out with its contents beside it: how the tracker works, SEO, vitals, every check", async () => {
		await renderAt("/info");

		await screen.findByRole("heading", { name: "Info", level: 2 });
		const nav = contents();
		for (const chapter of [
			"How the tracker works",
			"The SEO score",
			"Keywords",
			"Crawling and indexing",
			"Technical SEO",
			"LCP — loading",
			"Titles and title links",
			"Rendering and JavaScript",
			"robots.txt in detail",
			"Canonicals: choosing the URL",
			"Site: robots.txt",
			"Backlinks and authority",
			"Lighthouse and our crawl",
			"Does accessibility affect SEO?",
			"SEO: crawling and indexing",
		])
			expect(
				within(nav).getByRole("link", { name: new RegExp(chapter) }),
			).toBeInTheDocument();
		expect(document.getElementById("ranking")).toHaveTextContent("What makes a page rank");
		expect(
			within(document.getElementById("checks-titles")!.closest("section")!).getByRole(
				"heading",
				{ name: "Titles" },
			),
		).toBeInTheDocument();
	});

	it("scrolls to a chapter when its link is clicked", async () => {
		await renderAt("/info");
		const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);
		scrollIntoView.mockClear();

		fireEvent.click(
			within(await screen.findByRole("navigation", { name: "Guide contents" })).getByRole(
				"link",
				{ name: "The SEO score" },
			),
		);

		expect(scrollIntoView).toHaveBeenCalledTimes(1);
		expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("score"));
	});

	it("opens a check with its rules, impact, example, how it is checked by the tracker and by hand, the fix and its sources", async () => {
		await renderAt("/info");

		await screen.findByRole("heading", { name: "Info", level: 2 });
		const card = document.getElementById("check-IMAGES_MISSING_ALT")!;
		fireEvent.click(within(card).getByRole("button", { name: /Images without alt text/ }));

		await waitFor(() => expect(within(card).getByText("Passes when")).toBeVisible());
		expect(within(card).getByText("Fails when")).toBeInTheDocument();
		expect(within(card).getByText("The page has no images.")).toBeInTheDocument();
		expect(within(card).getByText("How to fix it")).toBeInTheDocument();
		for (const block of [
			"If it passes",
			"If it fails",
			"What it should look like",
			"How the tracker checks it",
			"How to check it yourself",
		])
			expect(within(card).getByText(block)).toBeInTheDocument();
		expect(within(card).getByText("Correct")).toBeInTheDocument();
		expect(
			within(card).getByRole("link", { name: /Google image SEO best practices/ }),
		).toHaveAttribute(
			"href",
			"https://developers.google.com/search/docs/appearance/google-images",
		);
	});

	it("narrows to the matching checks from the URL, opened, without the prose", async () => {
		await renderAt("/info?q=hreflang%20reciprocal");

		expect(
			await screen.findByRole("heading", { name: /1 check matches “hreflang reciprocal”/ }),
		).toBeInTheDocument();
		expect(screen.getByText("Passes when")).toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "How the tracker works" }),
		).not.toBeInTheDocument();
		expect(
			within(contents()).getByRole("link", { name: /Language, mobile/ }),
		).toBeInTheDocument();
	});

	it("says when nothing matches, and goes back to the whole guide", async () => {
		const router = await renderAt("/info?q=zzzz");

		expect(await screen.findByText("No check matches “zzzz”")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Show the whole guide" }));

		await waitFor(() => expect(router.state.location.search).toEqual({}));
		expect(screen.getByRole("textbox", { name: "Search checks" })).toHaveValue("");
		expect(
			await screen.findByRole("heading", { name: "How the tracker works" }),
		).toBeInTheDocument();
	});

	it("is behind the session guard", async () => {
		vi.spyOn(SessionGateway.prototype, "me").mockResolvedValue(null);
		const router = await renderAt("/info");

		await waitFor(() => expect(router.state.location.pathname).toBe("/sign-in"));
	});
});
