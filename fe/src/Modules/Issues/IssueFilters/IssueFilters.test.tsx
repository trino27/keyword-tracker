import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TIssuesSearch } from "@App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema";
import { IssueFilters } from "./IssueFilters";

const SEARCH: TIssuesSearch = {
	group: "issue",
	levels: ["error", "warning", "notice"],
	type: "all",
};

const renderFilters = (search: Partial<TIssuesSearch> = {}, pageTitle: string | null = null) => {
	const onChange = vi.fn();
	render(
		<MantineProvider>
			<IssueFilters
				search={{ ...SEARCH, ...search }}
				pageTitle={pageTitle}
				onChange={onChange}
			/>
		</MantineProvider>,
	);
	return onChange;
};

describe("IssueFilters", () => {
	it("keeps the levels in the catalogue's order, whichever was ticked last", () => {
		const onChange = renderFilters({ levels: ["notice"] });

		fireEvent.click(screen.getByRole("checkbox", { name: "Critical" }));

		expect(onChange).toHaveBeenCalledWith({ levels: ["error", "notice"] });
	});

	it("filters by type", () => {
		const onChange = renderFilters();

		fireEvent.click(screen.getByRole("radio", { name: "Speed" }));

		expect(onChange).toHaveBeenCalledWith({ type: "speed" });
	});

	it("names the page it is filtered to, and clears it", () => {
		const onChange = renderFilters({ pageId: 4 }, "Link building basics");

		const chip = screen.getByRole("button", {
			name: "Page: Link building basics — show every page",
		});
		expect(chip).toHaveTextContent("Page: Link building basics");

		fireEvent.click(chip);
		expect(onChange).toHaveBeenCalledWith({ pageId: undefined });
	});

	it("names a page it has no title for by its id", () => {
		renderFilters({ pageId: 4 });

		expect(
			screen.getByRole("button", { name: "Page: #4 — show every page" }),
		).toBeInTheDocument();
	});

	it("shows no page chip without a page filter", () => {
		renderFilters();

		expect(screen.queryByRole("button", { name: /show every page/ })).not.toBeInTheDocument();
	});
});
