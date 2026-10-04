import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IssuesSection } from "./IssuesSection";

const renderSection = (issues: Parameters<typeof IssuesSection>[0]["issues"], currentPages = 1) =>
	render(
		<MantineProvider>
			<IssuesSection issues={issues} currentPages={currentPages} />
		</MantineProvider>,
	);

describe("IssuesSection", () => {
	it("groups by severity, worst first, with the sentence and the fix", () => {
		renderSection([
			{
				code: "THIN_CONTENT",
				severity: "warning",
				details: { value: 120, min: 300 },
				pagesAffected: 1,
			},
			{ code: "H1_MISSING", severity: "error", details: {}, pagesAffected: 1 },
		]);

		const headings = screen
			.getAllByText(/^(Errors|Warnings|Notices)$/)
			.map((node) => node.textContent);
		expect(headings).toEqual(["Errors", "Warnings"]);
		expect(
			screen.getByText("The content has 120 words; aim for at least 300."),
		).toBeInTheDocument();
		expect(
			screen.getByText("Posts under 300 words rarely answer a query well enough to rank."),
		).toBeInTheDocument();
	});

	it("says so when there is nothing to fix", () => {
		renderSection([]);

		expect(screen.getByText("No issues found on the last crawl.")).toBeInTheDocument();
	});

	// The number that tells a user to go and edit a template instead of this page.
	it("an issue on five of fifteen pages reads 'on 5 of 15 pages'", () => {
		renderSection(
			[
				{
					code: "H1_MULTIPLE",
					severity: "warning",
					details: { count: 2 },
					pagesAffected: 5,
				},
			],
			15,
		);

		expect(screen.getByText("on 5 of 15 pages")).toBeInTheDocument();
	});

	it("an issue on one page says nothing extra", () => {
		renderSection(
			[
				{
					code: "H1_MULTIPLE",
					severity: "warning",
					details: { count: 2 },
					pagesAffected: 1,
				},
			],
			15,
		);

		expect(screen.queryByText(/of 15 pages/)).not.toBeInTheDocument();
	});

	it("links to the pages a run finding is about", () => {
		renderSection([
			{
				code: "KEYWORD_CANNIBALISATION",
				severity: "warning",
				details: { term: "ai marketing", otherUrls: ["https://a.example/guide/"] },
				pagesAffected: 2,
			},
		]);

		const link = screen.getByRole("link", { name: "https://a.example/guide/" });
		expect(link).toHaveAttribute("href", "https://a.example/guide/");
		expect(link).toHaveAttribute("target", "_blank");
		expect(screen.getByText('Another page leads with "ai marketing".')).toBeInTheDocument();
	});

	it("renders no link for a finding about the page alone", () => {
		renderSection([{ code: "H1_MISSING", severity: "error", details: {}, pagesAffected: 1 }]);

		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
});
