import { Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface IPageHeaderProps {
	title: ReactNode;
	description?: ReactNode;
	/** Above the title: a breadcrumb back to where the user came from. */
	breadcrumb?: ReactNode;
	/** Right-aligned: the screen's primary actions. */
	actions?: ReactNode;
}

/** The top of every screen: what it is, one line on why, and its main action. */
export function PageHeader({ title, description, breadcrumb, actions }: IPageHeaderProps) {
	return (
		<Stack gap={4} mb="lg">
			{breadcrumb}
			<Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
				<Stack gap={4} miw={0}>
					<Title order={2}>{title}</Title>
					{description && (
						<Text c="dimmed" size="sm">
							{description}
						</Text>
					)}
				</Stack>
				{actions && <Group gap="sm">{actions}</Group>}
			</Group>
		</Stack>
	);
}
