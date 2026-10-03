import { MantineProvider } from "@mantine/core";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PositionTable } from "./PositionTable";

const at = (day: string) => `${day}T12:00:00.000Z`;

describe("PositionTable", () => {
	it("shows latest, change as places gained, best and worst per keyword", () => {
		render(
			<MantineProvider>
				<PositionTable
					history={{
						from: "2026-09-01",
						to: "2026-09-03",
						timeZone: "America/Toronto",
						series: [
							{
								keywordId: 1,
								term: "remove www",
								points: [
									{ capturedAt: at("2026-09-01"), position: 12 },
									{ capturedAt: at("2026-09-02"), position: 15 },
									{ capturedAt: at("2026-09-03"), position: 8 },
								],
							},
							{ keywordId: 2, term: "new keyword", points: [] },
						],
					}}
				/>
			</MantineProvider>,
		);

		const [, first, second] = screen.getAllByRole("row");
		expect(within(first).getByText("#8")).toBeInTheDocument();
		expect(within(first).getByLabelText("up 4")).toBeInTheDocument();
		expect(within(first).getByText("15")).toBeInTheDocument();
		expect(within(second).getAllByText("—").length).toBeGreaterThanOrEqual(3);
	});
});
