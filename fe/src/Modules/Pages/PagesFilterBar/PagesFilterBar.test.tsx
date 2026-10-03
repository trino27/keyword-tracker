import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PagesFilterBar, SEARCH_DEBOUNCE_MS } from "./PagesFilterBar";

const renderBar = (onChange = vi.fn()) => {
	render(
		<MantineProvider>
			<PagesFilterBar search={{ page: 3, pageSize: 20 }} clients={[]} onChange={onChange} />
		</MantineProvider>,
	);
	return onChange;
};

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("PagesFilterBar", () => {
	it("writes the search once, after the user pauses", () => {
		const onChange = renderBar();
		const input = screen.getByLabelText("Search pages");

		fireEvent.change(input, { target: { value: "s" } });
		fireEvent.change(input, { target: { value: "se" } });
		fireEvent.change(input, { target: { value: "seo" } });
		act(() => {
			vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
		});
		expect(onChange).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledWith({ q: "seo" });
	});

	it("clearing the search writes it at once", () => {
		const onChange = renderBar();
		fireEvent.change(screen.getByLabelText("Search pages"), { target: { value: "seo" } });

		fireEvent.click(screen.getByLabelText("Clear search"));

		expect(onChange).toHaveBeenCalledWith({ q: undefined });
	});
});
