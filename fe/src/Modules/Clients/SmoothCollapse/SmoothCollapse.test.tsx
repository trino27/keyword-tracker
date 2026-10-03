import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SmoothCollapse } from "./SmoothCollapse";

const log = <p>run log</p>;

afterEach(() => vi.useRealTimers());

describe("SmoothCollapse", () => {
	it("mounts its children on the first expand and keeps them while the close animates", () => {
		vi.useFakeTimers();
		const { rerender } = render(<SmoothCollapse expanded={false}>{log}</SmoothCollapse>);
		expect(screen.queryByText("run log")).not.toBeInTheDocument();

		rerender(<SmoothCollapse expanded>{log}</SmoothCollapse>);
		expect(screen.getByText("run log")).toBeInTheDocument();

		// Still in the DOM right after the toggle: the row has a height to animate down from.
		rerender(<SmoothCollapse expanded={false}>{log}</SmoothCollapse>);
		expect(screen.getByText("run log")).toBeInTheDocument();

		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(screen.queryByText("run log")).not.toBeInTheDocument();
	});
});
