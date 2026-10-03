import { IconFileAnalytics } from "@tabler/icons-react";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";

/** Temporary: the run log links here before the detail screen exists. */
export function PageDetailScreen() {
	return (
		<>
			<PageHeader title="Page" />
			<EmptyState
				icon={<IconFileAnalytics size={22} />}
				title="Page details arrive in a later step"
			/>
		</>
	);
}
