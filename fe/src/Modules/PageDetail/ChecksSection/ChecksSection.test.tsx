import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEO_ISSUE_CODES } from "@app/contracts";
import type { TPageCheck } from "@Gateways/PageGateway/Validation/PageSchemas";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { ChecksSection } from "./ChecksSection";

const allPassing = (): TPageCheck[] =>
	SEO_ISSUE_CODES.map((code) => ({ code, status: "passed" as const }));

const withStatus = (code: string, status: TPageCheck["status"]): TPageCheck[] =>
	allPassing().map((check) => (check.code === code ? { ...check, status } : check));

const render = (checks: TPageCheck[] | null) =>
	renderWithProviders(() => <ChecksSection checks={checks} />);

describe("ChecksSection", () => {
	it("renders one row per catalogue check", async () => {
		render(allPassing());

		expect(await screen.findByText("Title is missing")).toBeInTheDocument();
		expect(screen.getByText("Not served over HTTPS")).toBeInTheDocument();
	});

	it("shows the denominator as a subtitle", async () => {
		render(withStatus("HEADING_SKIP", "notApplicable"));

		expect(
			await screen.findByText(`${SEO_ISSUE_CODES.length - 1} judged · 1 not applicable`),
		).toBeInTheDocument();
	});

	it("says why a check was skipped", async () => {
		render(withStatus("IMAGES_MISSING_ALT", "notApplicable"));

		expect(await screen.findByText("The page has no images.")).toBeInTheDocument();
	});

	it("says a check is newer than the crawl rather than calling it passed", async () => {
		render(withStatus("NOT_HTTPS", "notYetChecked"));

		expect(
			await screen.findByText("Added after this page was last crawled."),
		).toBeInTheDocument();
		expect(screen.getByText("Not served over HTTPS")).toHaveAttribute(
			"data-status",
			"notYetChecked",
		);
	});

	it("points at the issues section when something failed", async () => {
		render(withStatus("TITLE_LENGTH", "failed"));

		expect(
			await screen.findByText("Details for the 1 failed check are in SEO issues below."),
		).toBeInTheDocument();
	});

	/** The line would point at an empty section, so it is not rendered. */
	it("points nowhere when nothing failed", async () => {
		render(allPassing());

		await screen.findByText("Title is missing");
		expect(screen.queryByText(/are in SEO issues below/)).not.toBeInTheDocument();
	});

	it("asks for a re-crawl instead of inventing verdicts", async () => {
		render(null);

		expect(
			await screen.findByText("Re-crawl this page to see each check."),
		).toBeInTheDocument();
		expect(screen.queryByText("Title is missing")).not.toBeInTheDocument();
	});
});
