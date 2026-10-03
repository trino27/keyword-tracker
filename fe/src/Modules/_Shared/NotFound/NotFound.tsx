import { IconMapOff } from "@tabler/icons-react";
import { ButtonLink } from "../RouterLink/RouterLink";
import { EmptyState } from "../EmptyState/EmptyState";

interface INotFoundProps {
	/** What was not found, e.g. "This page". */
	what?: string;
}

/** An unknown URL, or an id that is missing or not the user's — one answer for both. */
export function NotFound({ what = "This page" }: INotFoundProps) {
	return (
		<EmptyState
			icon={<IconMapOff size={22} />}
			title={`${what} was not found`}
			description="It may have been removed by a newer crawl, or the link is wrong."
			action={
				<ButtonLink to="/pages" variant="light" mt="xs">
					Go to pages
				</ButtonLink>
			}
		/>
	);
}
