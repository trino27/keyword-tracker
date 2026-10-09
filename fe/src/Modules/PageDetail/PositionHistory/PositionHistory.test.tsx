import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { PositionHistory } from "./PositionHistory";

const HISTORY: TPositionHistory = {
	from: "2026-09-04",
	to: "2026-10-03",
	timeZone: "America/Toronto",
	series: [
		{
			keywordId: 1,
			term: "remove www",
			points: [{ capturedAt: "2026-10-01T12:00:00.000Z", position: 4 }],
		},
	],
};

const props = (over: Partial<Parameters<typeof PositionHistory>[0]> = {}) => ({
	history: null,
	status: "loading" as const,
	error: null,
	preset: "30d" as const,
	range: { from: "2026-09-04" as const, to: "2026-10-03" as const },
	today: "2026-10-03" as const,
	view: "chart" as const,
	hidden: [],
	filling: false,
	fillError: null,
	onPreset: vi.fn(),
	onCustom: vi.fn(),
	onView: vi.fn(),
	onToggle: vi.fn(),
	onRetry: vi.fn(),
	onFill: vi.fn(),
	...over,
});

const show = (over = {}) =>
	render(
		<MantineProvider>
			<PositionHistory {...props(over)} />
		</MantineProvider>,
	);

describe("PositionHistory", () => {
	it("stands in for the keyword chips while the history loads", () => {
		show();

		expect(screen.getByLabelText("Loading keywords")).toBeInTheDocument();
	});

	// The first question of a drop: did Google move? The band is drawn on the chart and
	// named, with a link to Google's own announcement, beneath it.
	it("names the Google updates the chart's days overlap, linked to the dashboard", () => {
		show({
			history: {
				...HISTORY,
				series: [
					{
						...HISTORY.series[0],
						points: [
							{ capturedAt: "2026-09-25T12:00:00.000Z", position: 4 },
							{ capturedAt: "2026-10-01T12:00:00.000Z", position: 9 },
						],
					},
				],
			},
			status: "ready",
			searchUpdates: [
				{
					id: "spam-sep",
					title: "September 2026 spam update",
					kind: "spam",
					begin: "2026-09-24T16:15:00.000Z",
					end: "2026-10-08T08:00:00.000Z",
					url: "https://status.search.google.com/incidents/spam-sep",
				},
				{
					id: "core-may",
					title: "May 2026 core update",
					kind: "core",
					begin: "2026-05-21T15:40:00.000Z",
					end: "2026-06-02T08:00:00.000Z",
					url: "https://status.search.google.com/incidents/core-may",
				},
			],
		});

		const link = screen.getByRole("link", { name: /September 2026 spam update/ });
		expect(link).toHaveAttribute("href", "https://status.search.google.com/incidents/spam-sep");
		// The rollout's own dates, not the two days of data the band is clipped to.
		expect(link).toHaveTextContent("September 2026 spam update (Sep 24–Oct 8)");
		expect(screen.queryByText(/May 2026 core update/)).not.toBeInTheDocument();
	});

	it("replaces the stand-in with the chips once the history is there", () => {
		show({ history: HISTORY, status: "ready" });

		expect(screen.queryByLabelText("Loading keywords")).not.toBeInTheDocument();
		expect(screen.getByRole("checkbox", { name: "remove www" })).toBeInTheDocument();
	});

	it("names the page's keywords even when no position has been generated", () => {
		const bare = { ...HISTORY, series: HISTORY.series.map((s) => ({ ...s, points: [] })) };

		show({ history: bare, status: "ready" });

		expect(screen.getByRole("checkbox", { name: "remove www" })).toBeInTheDocument();
		expect(screen.getByText(/No positions in this range/)).toBeInTheDocument();
	});

	it("names them in the table view too while there is nothing to tabulate", () => {
		const bare = { ...HISTORY, series: HISTORY.series.map((s) => ({ ...s, points: [] })) };

		show({ history: bare, status: "ready", view: "table" });

		expect(screen.getByRole("checkbox", { name: "remove www" })).toBeInTheDocument();
	});

	it("shows no stand-in when the history failed", () => {
		show({ status: "error", error: "Nope" });

		expect(screen.queryByLabelText("Loading keywords")).not.toBeInTheDocument();
		expect(screen.getByText("Could not load the history")).toBeInTheDocument();
	});
});
