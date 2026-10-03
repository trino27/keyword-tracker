import { Stack, Text } from "@mantine/core";
import { scoreBandOf, type IPageScore } from "@app/contracts";
import styles from "./ScoreBadge.module.scss";

interface IScoreBadgeProps {
	score: IPageScore;
	/** Show the fraction the score came from, e.g. "14/16 checks". */
	withNote?: boolean;
	size?: number;
}

/**
 * A page's health score in its band's colour.
 *
 * The note is the denominator, and it is not decoration: two pages with different
 * denominators must not silently compare as equals. What the number claims is only that
 * this page has no obvious technical defects — never a traffic prediction, a comparison
 * with a competitor, or a judgement of the writing.
 */
export function ScoreBadge({ score, withNote = false, size = 20 }: IScoreBadgeProps) {
	const passed = score.applicable - score.failed;
	return (
		<Stack gap={0}>
			<Text
				span
				fz={size}
				className={`${styles.badge} tabular`}
				data-band={scoreBandOf(score.value)}
				data-testid="score-badge"
			>
				{score.value}
			</Text>
			{withNote && (
				<Text size="xs" c="dimmed" className="tabular">
					{`${passed}/${score.applicable} checks`}
				</Text>
			)}
		</Stack>
	);
}
