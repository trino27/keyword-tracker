import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import type { IIssueCardView } from "@ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue";
import { IssueCard } from "./IssueCard";

const page = (id: number) => ({ id, url: `https://yoast.com/p${id}/`, title: `Post ${id}` });

const titleRow = (id: number) => ({
	code: "TITLE_LENGTH" as const,
	severity: "notice" as const,
	details: { value: 72, min: 30, max: 60 },
	location: { kind: "page" as const, page: page(id) },
});

/** A one-client card: its rows need no client heading. */
const oneClient = (card: Omit<IIssueCardView, "clients">): IIssueCardView => ({
	...card,
	clients: [{ client: null, affectedPages: card.affectedPages, rows: card.rows }],
});

const CARD: IIssueCardView = oneClient({
	code: "TITLE_LENGTH",
	severity: "notice",
	affectedPages: 2,
	wholeSite: false,
	rows: [titleRow(1), titleRow(2)],
});

describe("IssueCard", () => {
	it("says what, why and what to do in the catalogue's plain words, with the level", async () => {
		renderWithProviders(() => <IssueCard card={CARD} />);
		const { plain } = SEO_ISSUE_CATALOGUE.TITLE_LENGTH;

		expect(await screen.findByText(plain.what)).toBeInTheDocument();
		expect(screen.getByText(plain.why)).toBeInTheDocument();
		expect(screen.getByText(plain.fix)).toBeInTheDocument();
		expect(screen.getByText("Improvement")).toBeInTheDocument();
		expect(screen.getByText("affects 2 pages")).toBeInTheDocument();
	});

	it("names every page with the finding's own sentence, linked to the page", async () => {
		renderWithProviders(() => <IssueCard card={CARD} />);

		expect(await screen.findByRole("link", { name: "Post 1" })).toHaveAttribute(
			"href",
			"/pages/1",
		);
		expect(screen.getAllByText("The title is 72 characters; aim for 30–60.")).toHaveLength(2);
	});

	it("keeps the technical account folded until asked", async () => {
		renderWithProviders(() => <IssueCard card={CARD} />);
		const toggle = await screen.findByRole("button", { name: /Technical details/ });

		expect(toggle).toHaveAttribute("aria-expanded", "false");
		await userEvent.click(toggle);

		// jsdom never finishes Mantine's collapse transition, so the state is read from the
		// button rather than from the panel's computed visibility.
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText(SEO_ISSUE_CATALOGUE.TITLE_LENGTH.label)).toBeInTheDocument();
	});

	/** One check is shown without advice, by decision (plan D33). */
	it("leaves out What to do for a check that has no advice", async () => {
		renderWithProviders(() => (
			<IssueCard
				card={oneClient({
					code: "SITEMAP_LISTS_NON_INDEXABLE",
					severity: "warning",
					affectedPages: 15,
					wholeSite: true,
					rows: [
						{
							code: "SITEMAP_LISTS_NON_INDEXABLE",
							severity: "warning",
							details: {},
							location: { kind: "site" },
						},
					],
				})}
			/>
		));

		expect(
			await screen.findByText(
				"The site's sitemap lists pages that aren't meant to be in search results",
			),
		).toBeInTheDocument();
		expect(screen.getByText("Why it matters")).toBeInTheDocument();
		expect(screen.queryByText("What to do")).not.toBeInTheDocument();
		expect(screen.queryByText(/check your sitemap plugin's settings/)).not.toBeInTheDocument();
	});

	it("across clients, groups the pages under each client's name and site", async () => {
		renderWithProviders(() => (
			<IssueCard
				card={{
					...CARD,
					affectedPages: 3,
					rows: [titleRow(1), titleRow(2), titleRow(3)],
					clients: [
						{
							client: { id: 7, name: "Yoast", site: "yoast.com" },
							affectedPages: 2,
							rows: [titleRow(1), titleRow(2)],
						},
						{
							client: { id: 8, name: "Ahrefs", site: "ahrefs.com" },
							affectedPages: 1,
							rows: [titleRow(3)],
						},
					],
				}}
			/>
		));

		const yoast = await screen.findByRole("group", { name: "Yoast" });
		expect(within(yoast).getByText("yoast.com")).toBeInTheDocument();
		expect(
			within(yoast)
				.getAllByRole("link")
				.map((link) => link.textContent),
		).toEqual(["Post 1", "Post 2"]);
		const ahrefs = screen.getByRole("group", { name: "Ahrefs" });
		expect(within(ahrefs).getByRole("link", { name: "Post 3" })).toBeInTheDocument();
		expect(screen.getByText("affects 3 pages")).toBeInTheDocument();
	});

	it("a one-client card has no client heading", async () => {
		renderWithProviders(() => <IssueCard card={CARD} />);

		await screen.findByRole("link", { name: "Post 1" });
		expect(screen.queryByRole("group")).not.toBeInTheDocument();
	});

	it("says Whole site for a site check", async () => {
		renderWithProviders(() => (
			<IssueCard
				card={oneClient({
					code: "SOFT_404",
					severity: "warning",
					affectedPages: 15,
					wholeSite: true,
					rows: [
						{
							code: "SOFT_404",
							severity: "warning",
							details: {},
							location: { kind: "site" },
						},
					],
				})}
			/>
		));

		expect(await screen.findAllByText("Whole site")).not.toHaveLength(0);
		expect(screen.getByText("Important")).toBeInTheDocument();
	});
});
