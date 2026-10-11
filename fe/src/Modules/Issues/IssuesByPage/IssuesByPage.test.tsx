import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import type { TReportIssue } from "@Gateways/IssueReportGateway/Validation/IssueReportSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { IssuesByPage } from "./IssuesByPage";

const page = (id: number) => ({ id, url: `https://yoast.com/p${id}/`, title: `Post ${id}` });

const ROWS: TReportIssue[] = [
	{
		code: "LANG_MISSING",
		severity: "notice",
		details: {},
		location: { kind: "page", page: page(1) },
	},
	{
		code: "H1_MISSING",
		severity: "warning",
		details: {},
		location: { kind: "page", page: page(2) },
	},
	{
		code: "CWV_INP_NEEDS_IMPROVEMENT",
		severity: "notice",
		details: { value: 210, max: 200, source: "origin" },
		location: { kind: "allPages", pageCount: 15 },
	},
];

describe("IssuesByPage", () => {
	it("leads with the whole site, then the page with the worst problems", async () => {
		renderWithProviders(() => <IssuesByPage issues={ROWS} />);

		const headings = (await screen.findAllByText(/^(Whole site|Post \d)$/)).map(
			(node) => node.textContent,
		);
		expect(headings[0]).toBe("Whole site");
		expect(headings.filter((text) => text?.startsWith("Post"))).toEqual(["Post 2", "Post 1"]);
	});

	it("counts each page's problems by level", async () => {
		renderWithProviders(() => <IssuesByPage issues={ROWS} />);

		expect(await screen.findByText("1 Important")).toBeInTheDocument();
		expect(screen.getByText("1 Improvement")).toBeInTheDocument();
	});

	it("says the whole-site figure is Google's for the site, with its page count", async () => {
		renderWithProviders(() => <IssuesByPage issues={ROWS} />);

		expect(await screen.findByText("Whole site (15 pages)")).toBeInTheDocument();
		expect(
			screen.getByText(SEO_ISSUE_CATALOGUE.CWV_INP_NEEDS_IMPROVEMENT.plain.what),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"INP on mobile is 210 ms for the whole site's real visitors; good is 200 ms or less.",
			),
		).toBeInTheDocument();
	});
});
