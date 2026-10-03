import { Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import type { ReactNode } from "react";

interface IEmptyStateProps {
	icon: ReactNode;
	title: string;
	description?: ReactNode;
	/** The one thing that gets the user out of the empty state. */
	action?: ReactNode;
}

/** Nothing to show — said plainly, with the way forward. */
export function EmptyState({ icon, title, description, action }: IEmptyStateProps) {
	return (
		<Paper withBorder radius="md" p="xl">
			<Stack align="center" gap="xs" ta="center">
				<ThemeIcon size={44} radius="xl" variant="light">
					{icon}
				</ThemeIcon>
				<Text fw={600}>{title}</Text>
				{description && (
					<Text c="dimmed" size="sm" maw={420}>
						{description}
					</Text>
				)}
				{action}
			</Stack>
		</Paper>
	);
}
