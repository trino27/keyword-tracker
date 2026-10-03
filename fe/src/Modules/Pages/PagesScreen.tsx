import { IconListDetails } from "@tabler/icons-react";
import { EmptyState } from "@Modules/_Shared/EmptyState/EmptyState";
import { PageHeader } from "@Modules/_Shared/PageHeader/PageHeader";

/** Temporary: the sign-in redirect needs a target before the list exists. */
export function PagesScreen() {
	return (
		<>
			<PageHeader title="Pages" />
			<EmptyState
				icon={<IconListDetails size={22} />}
				title="Pages arrive in the next step"
			/>
		</>
	);
}
