import { Badge, Tooltip, type BadgeProps } from "@mantine/core";
import { positionBucket } from "@Core/Helpers/PositionBucket/positionBucket";

interface IPositionBadgeProps {
	position: number | null;
	size?: BadgeProps["size"];
	/** The keyword the position belongs to, named on hover where the row has no room. */
	keyword?: string;
}

/** A Google position in its bucket's colour; "—" until the first snapshot exists. */
export function PositionBadge({ position, size = "md", keyword }: IPositionBadgeProps) {
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
	const badge = (
		<Badge
			color={bucket.color}
			variant="filled"
			size={size}
			className="tabular"
			title={keyword ? undefined : bucket.label}
		>
			#{position}
		</Badge>
	);
	if (!keyword) return badge;
	return (
		<Tooltip label={`${keyword} · ${bucket.label}`} withArrow>
			{badge}
		</Tooltip>
	);
}
