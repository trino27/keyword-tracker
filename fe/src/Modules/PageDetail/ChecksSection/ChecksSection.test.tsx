import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	ACTIVE_ISSUE_CODES,
	LIGHTHOUSE_ISSUE_CODES,
	type TCheckStatus,
	type TChecksByOwner,
} from "@app/contracts";
import { CHECK_TOPICS, CHECK_TOPIC_OF } from "@Core/Constants/checkTopics";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { ChecksSection } from "./ChecksSection";

type TStatuses = Partial<Record<string, TCheckStatus>>;

const crawl = (statuses: TStatuses = {}) =>
	ACTIVE_ISSUE_CODES.map((code) => ({ code, status: statuses[code] ?? "passed" }));

const lighthouse = (statuses: TStatuses = {}) =>
	LIGHTHOUSE_ISSUE_CODES.map((code) => ({ code, status: statuses[code] ?? "passed" }));

const render = (byOwner: Partial<TChecksByOwner> = {}) =>
	renderWithProviders(() => (
		<ChecksSection
			checksByOwner={{ crawl: crawl(), lighthouse: lighthouse(), ...byOwner }}
			context={{
				crawledAt: "2026-10-10T16:00:00Z",
				lighthouseMeasuredAt:
					"lighthouse" in byOwner && byOwner.lighthouse === null
						? null
						: "2026-10-11T16:00:00Z",
				pageSpeedState: "active",
			}}
			timeZone="America/Toronto"
		/>
	));

const CRAWL = ACTIVE_ISSUE_CODES.length;

describe("ChecksSection", () => {
	/** PAGEDETAIL-009 "a page with two skipped checks and two failures", Lighthouse unmeasured. */
	it("lists our checks with the denominator, the skip reason, and one line for Lighthouse", async () => {
		render({
			crawl: crawl({
				IMAGES_MISSING_ALT: "notApplicable",
				HEADING_SKIP: "notApplicable",
				TITLE_LENGTH: "failed",
				LANG_MISSING: "failed",
			}),
			lighthouse: null,
		});

		expect(
			await screen.findByText(`Our checks: ${CRAWL - 2} judged · 2 not applicable`),
		).toBeInTheDocument();
		expect(screen.getByText("The page has no images.")).toBeInTheDocument();
		expect(screen.getAllByText("Lighthouse has not checked this page yet.")).toHaveLength(1);
		expect(
			screen.getByText("Details for the 2 failed checks are in SEO issues below."),
		).toBeInTheDocument();
	});

	it("dates each column in the user's zone", async () => {
		render();

		expect(await screen.findByText("Oct 10, 2026")).toBeInTheDocument();
		expect(screen.getByText("Oct 11, 2026")).toBeInTheDocument();
	});

	/** PAGEDETAIL-009 "the canonical group". */
	it("puts our five canonical checks beside Lighthouse's one, and says when they disagree", async () => {
		render({ lighthouse: lighthouse({ LH_CANONICAL: "failed" }) });

		const lighthouseLabel = await screen.findByText("Canonical URL is invalid or misdirected");
		const row = lighthouseLabel.closest("[data-disagree]") as HTMLElement;
		expect(row).not.toBeNull();
		expect(within(row).getByText("Canonical URL is declared")).toBeInTheDocument();
		expect(within(row).getByText("Canonical URL is absolute")).toBeInTheDocument();
		expect(within(row).getByText("Sources disagree")).toBeInTheDocument();
		// The reason is said in full under the marker, not hidden in a tooltip.
		expect(
			within(row).getByText(/Lighthouse does not judge a missing canonical/),
		).toBeInTheDocument();
		expect(lighthouseLabel).toHaveAttribute("data-status", "failed");
	});

	/** PAGEDETAIL-009 "a Lighthouse-only accessibility failure". */
	it("lists a Lighthouse-only failure first under its heading, with no cell of ours", async () => {
		render({ lighthouse: lighthouse({ LH_COLOR_CONTRAST: "failed" }) });

		expect(
			await screen.findByText(
				CHECK_TOPICS.find(({ id }) => id === CHECK_TOPIC_OF.LH_COLOR_CONTRAST)!.title,
			),
		).toBeInTheDocument();
		const failed = screen.getByText("Text with too little contrast");
		expect(failed).toHaveAttribute("data-status", "failed");
		// Lighthouse's own audits sit in a block of their own, after ours.
		expect(screen.getAllByText("Lighthouse audits")).toHaveLength(1);
		// Nothing of ours judges contrast, so there is nothing to disagree with.
		expect(screen.queryByText("Sources disagree")).not.toBeInTheDocument();
	});

	/** The line would point at an empty section, so it is not rendered. */
	it("points nowhere when nothing failed", async () => {
		render();

		await screen.findAllByText("Title is present");
		expect(screen.queryByText(/are in SEO issues below/)).not.toBeInTheDocument();
		expect(screen.queryByText("Sources disagree")).not.toBeInTheDocument();
	});

	it("asks for a re-crawl instead of inventing our verdicts", async () => {
		render({ crawl: null });

		expect(
			await screen.findByText("Re-crawl this page to see each check."),
		).toBeInTheDocument();
		expect(screen.queryByText("Thin content")).not.toBeInTheDocument();
		expect(screen.getByText("Canonical URL is valid")).toBeInTheDocument();
	});

	it("says a Lighthouse audit was not recorded rather than calling it passed", async () => {
		render({ lighthouse: lighthouse({ LH_TABINDEX: "notYetChecked" }) });

		expect(
			await screen.findByText("Lighthouse did not report this audit in its last run."),
		).toBeInTheDocument();
	});
});
