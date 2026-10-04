import { Chip, ColorSwatch, Group, Text, Tooltip } from "@mantine/core";
import type { TPositionHistory } from "@Gateways/PageGateway/Validation/PageSchemas";
import { keywordColor } from "../../keywordColors";

interface IKeywordTogglesProps {
	series: TPositionHistory["series"];
	hidden: number[];
	onToggle: (keywordId: number) => void;
}

/**
 * Which keywords the chart draws; one without positions in the range is struck through.
 * When no keyword has a position at all there is no chart to be missing from, and the
 * chips are the only place the page's keywords are named — so none of them is struck.
 */
export function KeywordToggles({ series, hidden, onToggle }: IKeywordTogglesProps) {
	const nothingToDraw = series.every((keyword) => keyword.points.length === 0);

	return (
		<Group gap={6} wrap="wrap">
			{series.map((keyword, index) => {
				const empty = !nothingToDraw && keyword.points.length === 0;
				const chip = (
					<Chip
						key={keyword.keywordId}
						size="xs"
						variant="outline"
						checked={!hidden.includes(keyword.keywordId)}
						onChange={() => onToggle(keyword.keywordId)}
						disabled={empty}
						icon={<ColorSwatch color={keywordColor(index)} size={10} />}
						// The icon slot is sized for the check mark it usually holds — 9px at
						// this chip size, with its overflow hidden — which sliced the top and
						// bottom off the colour dot. The slot takes the dot's height instead.
						styles={{ iconWrapper: { height: "auto", overflow: "visible" } }}
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
