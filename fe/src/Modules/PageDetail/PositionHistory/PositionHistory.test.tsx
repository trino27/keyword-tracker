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

	it("replaces the stand-in with the chips once the history is there", () => {
		show({ history: HISTORY, status: "ready" });

		expect(screen.queryByLabelText("Loading keywords")).not.toBeInTheDocument();
		expect(screen.getByRole("checkbox", { name: "remove www" })).toBeInTheDocument();
	});

	it("shows no stand-in when the history failed", () => {
		show({ status: "error", error: "Nope" });

		expect(screen.queryByLabelText("Loading keywords")).not.toBeInTheDocument();
		expect(screen.getByText("Could not load the history")).toBeInTheDocument();
	});
});
