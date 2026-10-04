import { Button } from "@mantine/core";
import {
	IconBuildingStore,
	IconFileSearch,
	IconHourglass,
	IconSearchOff,
} from "@tabler/icons-react";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { ButtonLink } from "@Modules/_Shared/RouterLink/RouterLink";
import type { TEmptyKind } from "@ViewModels/PagesViewModel/Services/ToEmptyKind/toEmptyKind";

interface IEmptyListProps {
	kind: TEmptyKind;
	onClearSearch: () => void;
}

/** What stands in for the table: why it is empty decides what the reader can do next. */
export function EmptyList({ kind, onClearSearch }: IEmptyListProps) {
	switch (kind) {
		case "noClients":
			return (
				<EmptyState
					icon={<IconBuildingStore size={22} />}
					title="No clients yet"
					description="Add a client: we find its blog, crawl the first 15 posts and extract their keywords."
					action={
						<ButtonLink to="/clients" mt="xs">
							Add a client
						</ButtonLink>
					}
				/>
			);
		case "noMatches":
			return (
				<EmptyState
					icon={<IconSearchOff size={22} />}
					title="No pages match this search"
					description="The search looks at page URLs and keywords."
					action={
						<Button variant="light" mt="xs" onClick={onClearSearch}>
							Clear the search
						</Button>
					}
				/>
			);
		case "noPagesYet":
			return (
				<EmptyState
					icon={<IconHourglass size={22} />}
					title="This client has no pages yet"
					description="Its posts appear here when a crawl finishes; the banner above shows where it is."
				/>
			);
		case "noPages":
			return (
				<EmptyState
					icon={<IconFileSearch size={22} />}
					title="No crawled pages yet"
					description="Crawls run in the background; pages appear as each one finishes."
				/>
			);
	}
}
