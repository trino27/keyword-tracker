import { Group, Text } from "@mantine/core";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";

/** Gained places are good news: green and up, even though the number went down. */
export function PositionChange({ value }: { value: number | null }) {
	if (value === null) return <Text c="dimmed">—</Text>;
	if (value === 0)
		return (
			<Group gap={2} c="dimmed" wrap="nowrap">
				<IconMinus size={14} />
				<Text span size="sm">
					0
				</Text>
			</Group>
		);
	const better = value > 0;
	return (
		<Group
			gap={2}
			c={better ? "teal" : "red"}
			wrap="nowrap"
			aria-label={better ? `up ${value}` : `down ${-value}`}
		>
			{better ? <IconArrowUpRight size={14} /> : <IconArrowDownRight size={14} />}
			<Text span size="sm" fw={600} className="tabular">
				{Math.abs(value)}
			</Text>
		</Group>
	);
}
