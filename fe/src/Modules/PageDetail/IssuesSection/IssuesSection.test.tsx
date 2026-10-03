import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IssuesSection } from "./IssuesSection";

const renderSection = (issues: Parameters<typeof IssuesSection>[0]["issues"]) =>
	render(
		<MantineProvider>
			<IssuesSection issues={issues} />
		</MantineProvider>,
	);

describe("IssuesSection", () => {
	it("groups by severity, worst first, with the sentence and the fix", () => {
		renderSection([
			{ code: "THIN_CONTENT", severity: "warning", details: { value: 120, min: 300 } },
			{ code: "H1_MISSING", severity: "error", details: {} },
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
});
