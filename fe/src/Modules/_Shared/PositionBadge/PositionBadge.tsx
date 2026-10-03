import { Badge, Tooltip, type BadgeProps } from "@mantine/core";
import { positionBucket } from "@Core/Helpers/PositionBucket/positionBucket";

interface IPositionBadgeProps {
	position: number | null;
	size?: BadgeProps["size"];
}

/** A Google position in its bucket's colour; "—" until the first snapshot exists. */
export function PositionBadge({ position, size = "md" }: IPositionBadgeProps) {
	const bucket = positionBucket(position);
	if (position === null) {
		return (
			<Tooltip label="Positions appear after the next seed run" withArrow>
				<Badge color="gray" variant="outline" size={size}>
					—
				</Badge>
			</Tooltip>
		);
	}
	return (
		<Badge
			color={bucket.color}
			variant="filled"
			size={size}
			className="tabular"
			title={bucket.label}
		>
			#{position}
		</Badge>
	);
}
