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
		lcp: { value: 3100, band: "needsImprovement", source: "url" },
		inp: null,
		cls: { value: 0.12, band: "needsImprovement", source: "lab" },
		performanceScore: 72,
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
			await screen.findByText(/Lighthouse performance score \(lab\): 72\/100/),
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
});
