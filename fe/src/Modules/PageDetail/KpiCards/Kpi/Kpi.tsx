import { Group, Paper, Stack, Text } from "@mantine/core";
import type { ReactNode } from "react";

interface IKpiProps {
	label: string;
	value: ReactNode;
	note?: ReactNode;
}

/** One card of the summary row: a label, the number, and one line of context under it. */
export function Kpi({ label, value, note }: IKpiProps) {
	return (
		<Paper withBorder radius="md" p="md">
			<Stack gap={6}>
				<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
					{label}
				</Text>
				<Group gap="xs" align="center" mih={30}>
					{value}
				</Group>
				{note && (
					<Text size="xs" c="dimmed" lineClamp={1}>
						{note}
					</Text>
				)}
			</Stack>
		</Paper>
	);
}
