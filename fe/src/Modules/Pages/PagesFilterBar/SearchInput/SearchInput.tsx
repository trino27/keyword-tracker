import { CloseButton, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const SEARCH_DEBOUNCE_MS = 300;

interface ISearchInputProps {
	initial: string;
	onCommit: (q: string | undefined) => void;
}

/**
 * Search is instant to type and lazy to send: the text lives here and reaches the URL
 * once the user pauses, so a word is one request, not one per letter.
 */
export function SearchInput({ initial, onCommit }: ISearchInputProps) {
	const [text, setText] = useState(initial);

	useEffect(() => {
		if (text.trim() === initial.trim()) return;
		const timer = setTimeout(() => onCommit(text.trim() || undefined), SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [text, initial, onCommit]);

	return (
		<TextInput
			aria-label="Search pages"
			placeholder="Search by URL or keyword"
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
							onCommit(undefined);
						}}
					/>
				) : null
			}
			style={{ flex: 1, minWidth: 220 }}
		/>
	);
}
