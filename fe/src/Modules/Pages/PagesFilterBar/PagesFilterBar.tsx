import { CloseButton, Group, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { TPagesSearch } from "@App/Router/SearchSchemas/PagesSearchSchema/pagesSearchSchema";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";

export const SEARCH_DEBOUNCE_MS = 300;

export type TPagesFilterChange = Partial<Pick<TPagesSearch, "clientId" | "q">>;

interface IPagesFilterBarProps {
	search: TPagesSearch;
	clients: TClient[];
	/** Every filter change goes back to page 1; the screen writes it to the URL. */
	onChange: (change: TPagesFilterChange) => void;
}

/**
 * Search is instant to type and lazy to send: the text lives here and reaches the URL
 * once the user pauses, so a word is one request, not one per letter.
 */
function SearchInput({
	initial,
	onCommit,
}: {
	initial: string;
	onCommit: (q: string | undefined) => void;
}) {
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

export function PagesFilterBar({ search, clients, onChange }: IPagesFilterBarProps) {
	return (
		<Group gap="sm" align="flex-end" wrap="wrap">
			{/* Remounted when the URL's q changes from outside (e.g. "Clear filters"). */}
			<SearchInput
				key={search.q ?? ""}
				initial={search.q ?? ""}
				onCommit={(q) => onChange({ q })}
			/>
			<Select
				aria-label="Client"
				placeholder="All clients"
				data={clients.map((client) => ({ value: String(client.id), label: client.name }))}
				value={search.clientId === undefined ? null : String(search.clientId)}
				onChange={(value) =>
					onChange({ clientId: value === null ? undefined : Number(value) })
				}
				clearable
				w={220}
			/>
		</Group>
	);
}
