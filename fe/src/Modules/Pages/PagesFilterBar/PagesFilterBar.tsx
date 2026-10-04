import { Group, Select } from "@mantine/core";
import type { TPagesSearch } from "@App/Router/SearchSchemas/PagesSearchSchema/pagesSearchSchema";
import type { TClient } from "@Gateways/ClientGateway/Validation/ClientSchemas";
import { SearchInput } from "./SearchInput/SearchInput";

export type TPagesFilterChange = Partial<Pick<TPagesSearch, "clientId" | "q">>;

interface IPagesFilterBarProps {
	search: TPagesSearch;
	clients: TClient[];
	/** Every filter change goes back to page 1; the screen writes it to the URL. */
	onChange: (change: TPagesFilterChange) => void;
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
