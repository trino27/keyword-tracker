import { List, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface IDoAvoidProps {
	good: ReactNode[];
	bad: ReactNode[];
	goodTitle?: string;
	badTitle?: string;
}

/** What helps and what hurts, side by side: the two lists a reader acts on. */
export function DoAvoid({ good, bad, goodTitle = "Do", badTitle = "Avoid" }: IDoAvoidProps) {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
			<Column title={goodTitle} items={good} color="teal" icon={<IconCheck size={12} />} />
			<Column title={badTitle} items={bad} color="red" icon={<IconX size={12} />} />
		</SimpleGrid>
	);
}

function Column({
	title,
	items,
	color,
	icon,
}: {
	title: string;
	items: ReactNode[];
	color: string;
	icon: ReactNode;
}) {
	return (
		<Stack gap={6}>
			<Text size="sm" fw={700} c={color}>
				{title}
			</Text>
			<List
				size="sm"
				spacing={6}
				icon={
					<ThemeIcon color={color} size={18} radius="xl" variant="light">
						{icon}
					</ThemeIcon>
				}
			>
				{items.map((item, index) => (
					// The lists are fixed prose; their order never changes.
					<List.Item key={index}>{item}</List.Item>
				))}
			</List>
		</Stack>
	);
}
