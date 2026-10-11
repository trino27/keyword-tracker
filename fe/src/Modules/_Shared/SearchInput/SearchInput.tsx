import { CloseButton, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useEffectEvent, useState } from "react";

export const SEARCH_DEBOUNCE_MS = 300;

interface ISearchInputProps {
	initial: string;
	onCommit: (q: string | undefined) => void;
	label?: string;
	placeholder?: string;
}

/**
 * Search is instant to type and lazy to send: the text lives here and reaches the URL
 * once the user pauses, so a word is one request, not one per letter.
 *
 * The box stays mounted while the user types. A new `initial` that is the echo of what it
 * sent leaves the text alone — the user may already be typing on — and any other one (a
 * "clear filters", the back button) replaces it. Remounting on every change instead threw
 * the focus away at each pause.
 */
export function SearchInput({
	initial,
	onCommit,
	label = "Search pages",
	placeholder = "Search by URL or keyword",
}: ISearchInputProps) {
	const [text, setText] = useState(initial);
	const [seen, setSeen] = useState(initial);
	const [sent, setSent] = useState<string | null>(null);

	if (initial !== seen) {
		setSeen(initial);
		if (initial !== sent) setText(initial);
	}

	// The caller's latest handler, without restarting the pause on every parent render.
	const commit = useEffectEvent((q: string) => {
		setSent(q);
		onCommit(q || undefined);
	});

	useEffect(() => {
		if (text.trim() === initial.trim()) return;
		const timer = setTimeout(() => commit(text.trim()), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [text, initial]);

	return (
		<TextInput
			aria-label={label}
			placeholder={placeholder}
			leftSection={<IconSearch size={16} />}
			value={text}
			onChange={(event) => setText(event.currentTarget.value)}
			rightSection={
				text ? (
					<CloseButton
						size="sm"
						aria-label="Clear search"
						onClick={() => {
							setText("");
							setSent("");
							onCommit(undefined);
						}}
					/>
				) : null
			}
			style={{ flex: 1, minWidth: 220 }}
		/>
	);
}
