import { Chip, ColorSwatch, Group, Text, Tooltip } from "@mantine/core";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { keywordColor } from "../../keywordColors";

interface IKeywordTogglesProps {
	series: TPositionHistory["series"];
	hidden: number[];
	onToggle: (keywordId: number) => void;
}

/** Which keywords the chart draws; one without positions in the range is struck through. */
export function KeywordToggles({ series, hidden, onToggle }: IKeywordTogglesProps) {
	return (
		<Group gap={6} wrap="wrap">
			{series.map((keyword, index) => {
				const empty = keyword.points.length === 0;
				const chip = (
					<Chip
						key={keyword.keywordId}
						size="xs"
						variant="outline"
						checked={!hidden.includes(keyword.keywordId)}
						onChange={() => onToggle(keyword.keywordId)}
						disabled={empty}
						icon={<ColorSwatch color={keywordColor(index)} size={10} />}
					>
						<Text span size="xs" td={empty ? "line-through" : undefined}>
							{keyword.term}
						</Text>
					</Chip>
				);
				return empty ? (
					<Tooltip key={keyword.keywordId} label="No positions in this range" withArrow>
						<span>{chip}</span>
					</Tooltip>
				) : (
					chip
				);
			})}
		</Group>
	);
}
