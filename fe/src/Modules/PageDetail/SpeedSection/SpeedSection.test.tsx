import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IPageSpeedSummary } from "@app/contracts";
import { renderWithProviders } from "@Modules/_Shared/_Testing/renderWithProviders";
import { SpeedSection } from "./SpeedSection";

const MEASURED: IPageSpeedSummary = {
	status: "done",
	lastError: null,
	measurement: {
		measuredAt: "2026-10-09T12:00:00.000Z",
		lcp: { value: 3100, band: "needsImprovement", source: "url", share: null },
		inp: null,
		cls: { value: 0.12, band: "needsImprovement", source: "lab", share: null },
		performanceScore: 72,
		ttfb: null,
		lcpBreakdown: null,
		seoScore: null,
		accessibilityScore: null,
	},
};

const renderSection = (
	pageSpeed: IPageSpeedSummary | null,
	state: "active" | "notConfigured" | "keyRejected" = "active",
) =>
	renderWithProviders(() => (
		<SpeedSection pageSpeed={pageSpeed} availability={{ state }} timeZone="America/Toronto" />
	));

describe("SpeedSection", () => {
	it("shows each metric's value, band and source", async () => {
		renderSection(MEASURED);

		expect(await screen.findByText("3.1 s")).toBeInTheDocument();
		expect(screen.getByText("0.12")).toBeInTheDocument();
		expect(screen.getByText(/Real visitors to this page, measured/)).toBeInTheDocument();
	});

	it("a lab value says it may vary", async () => {
		renderSection(MEASURED);

		expect(await screen.findByText(/Lab test, may vary, measured/)).toBeInTheDocument();
	});

	it("INP without data says why", async () => {
		renderSection(MEASURED);

		expect(
			await screen.findByText(/No data — Google has no real-visitor measurement/),
		).toBeInTheDocument();
	});

	it("shows the lab performance score as a caption", async () => {
		renderSection(MEASURED);

		expect(
			await screen.findByLabelText("Lighthouse Performance score 72 of 100"),
		).toBeInTheDocument();
	});

	it("says a queued page is waiting in the queue", async () => {
		renderSection({ status: "queued", measurement: null, lastError: null });

		expect(await screen.findByText(/^In queue for measurement/)).toBeInTheDocument();
	});

	it("says a running page is being measured", async () => {
		renderSection({ status: "running", measurement: null, lastError: null });

		expect(await screen.findByText(/^Measuring…/)).toBeInTheDocument();
	});

	it("under keyRejected the block opens with the key-rejected notice", async () => {
		renderSection({ status: "queued", measurement: null, lastError: null }, "keyRejected");

		expect(await screen.findByText(/Google rejected the PageSpeed key/)).toBeInTheDocument();
		expect(screen.getByText(/paused until the PageSpeed key is fixed/)).toBeInTheDocument();
	});

	it("says PageSpeed is not configured without a key", async () => {
		renderSection(null, "notConfigured");

		expect(await screen.findByText(/no PageSpeed key is configured/)).toBeInTheDocument();
	});

	it("says why a page could not be measured", async () => {
		renderSection({ status: "failed", measurement: null, lastError: "PAGE_ERRORED" });

		expect(
			await screen.findByText("Couldn't measure: The page answered Google with an error."),
		).toBeInTheDocument();
	});

	it("keeps the old figures when a refresh failed, and says so", async () => {
		renderSection({ ...MEASURED, status: "failed", lastError: "PSI_UNAVAILABLE" });

		expect(await screen.findByText(/Couldn't refresh:/)).toBeInTheDocument();
		expect(screen.getByText("3.1 s")).toBeInTheDocument();
	});

	/** PAGEDETAIL-013 "field data for the page". */
	it("shows the field TTFB on a line of its own, and the share of visits under a metric", async () => {
		renderSection({
			...MEASURED,
			measurement: {
				...MEASURED.measurement!,
				lcp: {
					value: 3100,
					band: "needsImprovement",
					source: "url",
					share: { good: 0.68, poor: 0.11 },
				},
				ttfb: { value: 620, band: "good", source: "url", share: { good: 0.8, poor: 0.06 } },
			},
		});

		expect(
			await screen.findByText(
				"Time to first byte (real visitors to this page): 620 ms · Good",
			),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("68% of visits good, 21% need improvement, 11% poor"),
		).toBeInTheDocument();
	});

	/** PAGEDETAIL-013 "a lab-only measurement". */
	it("says there is no field TTFB, draws no share bar, and labels the breakdown lab", async () => {
		renderSection({
			...MEASURED,
			measurement: {
				...MEASURED.measurement!,
				lcpBreakdown: {
					element: { selector: "body > div.container > p", snippet: "<p>" },
					phases: [
						{ phase: "timeToFirstByte", ms: 2 },
						{ phase: "elementRenderDelay", ms: 185 },
					],
				},
			},
		});

		expect(
			await screen.findByText(/Time to first byte: no data — Google has no real-visitor/),
		).toBeInTheDocument();
		expect(screen.queryByLabelText(/% of visits good/)).not.toBeInTheDocument();
		expect(screen.getByText("Where the LCP's time went · lab")).toBeInTheDocument();
		expect(screen.getByText("Element render delay 99%")).toBeInTheDocument();
		expect(screen.getByText("body > div.container > p")).toBeInTheDocument();
		expect(screen.getByText(/do not add up to the LCP shown above/)).toBeInTheDocument();
	});

	/** PAGEDETAIL-013 "an image LCP": shares, never the phases' milliseconds as an LCP. */
	it("draws an image LCP's four phases as shares", async () => {
		renderSection({
			...MEASURED,
			measurement: {
				...MEASURED.measurement!,
				lcpBreakdown: {
					element: null,
					phases: [
						{ phase: "timeToFirstByte", ms: 6 },
						{ phase: "resourceLoadDelay", ms: 736 },
						{ phase: "resourceLoadDuration", ms: 43 },
						{ phase: "elementRenderDelay", ms: 1529 },
					],
				},
			},
		});

		expect(await screen.findByText("Resource load delay 32%")).toBeInTheDocument();
		expect(screen.getByText("Element render delay 66%")).toBeInTheDocument();
		expect(screen.queryByText(/1529/)).not.toBeInTheDocument();
	});

	/** PAGEDETAIL-013 "the category scores". */
	it("captions Lighthouse's SEO and accessibility scores as lab figures", async () => {
		renderSection({
			...MEASURED,
			measurement: { ...MEASURED.measurement!, seoScore: 92, accessibilityScore: 78 },
		});

		expect(await screen.findByLabelText("Lighthouse SEO score 92 of 100")).toBeInTheDocument();
		expect(
			screen.getByLabelText("Lighthouse Accessibility score 78 of 100"),
		).toBeInTheDocument();
	});
});
