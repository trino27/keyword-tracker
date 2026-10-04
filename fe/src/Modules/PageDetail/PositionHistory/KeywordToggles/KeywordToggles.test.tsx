import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KeywordToggles } from "./KeywordToggles";

const SERIES = [
	{
		keywordId: 1,
		term: "remove www",
		points: [{ capturedAt: "2026-10-01T12:00:00.000Z", position: 4 }],
	},
	{ keywordId: 2, term: "new keyword", points: [] },
];

describe("KeywordToggles", () => {
	it("toggles a keyword and strikes through one without points", () => {
		const onToggle = vi.fn();
		render(
			<MantineProvider>
				<KeywordToggles series={SERIES} hidden={[]} onToggle={onToggle} />
			</MantineProvider>,
		);

		fireEvent.click(screen.getByText("remove www"));

		expect(onToggle).toHaveBeenCalledWith(1);
		expect(screen.getByText("new keyword")).toHaveStyle({ textDecoration: "line-through" });
		expect(screen.getByRole("checkbox", { name: "new keyword" })).toBeDisabled();
	});

	it("strikes through none of them when not one has a position", () => {
		const none = SERIES.map((keyword) => ({ ...keyword, points: [] }));
		render(
			<MantineProvider>
				<KeywordToggles series={none} hidden={[]} onToggle={vi.fn()} />
			</MantineProvider>,
		);

		expect(screen.getByText("remove www")).not.toHaveStyle({
			textDecoration: "line-through",
		});
		expect(screen.getByRole("checkbox", { name: "new keyword" })).toBeEnabled();
	});

	it("shows a hidden keyword unchecked", () => {
		render(
			<MantineProvider>
				<KeywordToggles series={SERIES} hidden={[1]} onToggle={vi.fn()} />
			</MantineProvider>,
		);

		expect(screen.getByRole("checkbox", { name: "remove www" })).not.toBeChecked();
	});
});
