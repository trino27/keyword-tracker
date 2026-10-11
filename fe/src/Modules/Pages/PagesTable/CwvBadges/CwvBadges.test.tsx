import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { IPageSpeedSummary } from "@app/contracts";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { CwvBadges } from "./CwvBadges";

const MEASURED: IPageSpeedSummary = {
	status: "done",
	lastError: null,
	measurement: {
		measuredAt: "2026-10-09T12:00:00.000Z",
		lcp: { value: 3100, band: "needsImprovement", source: "url", share: null },
		inp: null,
		cls: { value: 0.3, band: "poor", source: "lab", share: null },
		performanceScore: 55,
		ttfb: null,
		lcpBreakdown: null,
		seoScore: null,
		accessibilityScore: null,
	},
};

const ACTIVE = { state: "active" } as const;

const renderBadges = (
	pageSpeed: IPageSpeedSummary | null,
	availability: { state: "active" | "notConfigured" | "keyRejected" } = ACTIVE,
) =>
	renderWithProviders(() => (
		<CwvBadges pageSpeed={pageSpeed} availability={availability} timeZone="America/Toronto" />
	));

describe("CwvBadges", () => {
	it("colours each metric by its band, and grey for no data", async () => {
		renderBadges(MEASURED);
		const bandOf = (text: string) =>
			screen.getByText(text).closest("[data-band]")?.getAttribute("data-band");

		await screen.findByText("LCP");

		expect(bandOf("LCP")).toBe("needsImprovement");
		expect(bandOf("INP")).toBe("noData");
		expect(bandOf("CLS")).toBe("poor");
	});

	it("says in the tooltip the value, the band, whose it is and when", async () => {
		renderBadges(MEASURED);

		await userEvent.hover(await screen.findByText("LCP"));

		expect(
			await screen.findByText(
				"LCP 3.1 s — needs improvement. Real visitors to this page, measured Oct 9.",
			),
		).toBeInTheDocument();
	});

	it("reads Measuring… while queued", async () => {
		renderBadges({ status: "queued", measurement: null, lastError: null });

		expect(await screen.findByText("Measuring…")).toBeInTheDocument();
	});

	it("a queued row reads Paused under keyRejected", async () => {
		renderBadges(
			{ status: "queued", measurement: null, lastError: null },
			{ state: "keyRejected" },
		);

		expect(await screen.findByText("Paused")).toBeInTheDocument();
	});

	it("reads Not measured for a page never queued", async () => {
		renderBadges(null);

		expect(await screen.findByText("Not measured")).toBeInTheDocument();
	});

	it("reads Couldn't measure for a page given up on", async () => {
		renderBadges({ status: "failed", measurement: null, lastError: "PAGE_LOAD_FAILED" });

		expect(await screen.findByText("Couldn't measure")).toBeInTheDocument();
	});

	it("keeps an old measurement and flags that the refresh failed", async () => {
		renderBadges({ ...MEASURED, status: "failed", lastError: "PSI_UNAVAILABLE" });

		expect(await screen.findByLabelText("Couldn't refresh")).toBeInTheDocument();
		expect(screen.getByText("LCP")).toBeInTheDocument();
	});

	it("is a dash without a key", async () => {
		renderBadges(null, { state: "notConfigured" });

		expect(await screen.findByLabelText("PageSpeed not configured")).toHaveTextContent("—");
	});
});
