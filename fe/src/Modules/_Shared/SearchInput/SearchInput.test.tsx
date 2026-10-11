import { MantineProvider } from "@mantine/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEARCH_DEBOUNCE_MS, SearchInput } from "./SearchInput";

/** A caller that keeps the query as the URL would, and can change it from outside. */
function Harness() {
	const [q, setQ] = useState<string | undefined>(undefined);
	return (
		<MantineProvider>
			<SearchInput initial={q ?? ""} onCommit={setQ} />
			<button type="button" onClick={() => setQ("from outside")}>
				Elsewhere
			</button>
			<output>{q ?? ""}</output>
		</MantineProvider>
	);
}

const pause = () =>
	act(() => {
		vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
	});

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe("SearchInput", () => {
	it("keeps the box and its focus when a pause sends the text", () => {
		render(<Harness />);
		const input = screen.getByLabelText("Search pages");
		input.focus();

		fireEvent.change(input, { target: { value: "canon" } });
		pause();
		expect(screen.getByRole("status")).toHaveTextContent("canon");

		const after = screen.getByLabelText("Search pages");
		expect(after).toBe(input);
		expect(after).toHaveFocus();

		fireEvent.change(after, { target: { value: "canonical" } });
		pause();
		expect(screen.getByRole("status")).toHaveTextContent("canonical");
		expect(after).toHaveValue("canonical");
	});

	it("takes a query changed from outside", () => {
		render(<Harness />);
		fireEvent.change(screen.getByLabelText("Search pages"), { target: { value: "seo" } });
		pause();

		fireEvent.click(screen.getByRole("button", { name: "Elsewhere" }));

		expect(screen.getByLabelText("Search pages")).toHaveValue("from outside");
	});
});
