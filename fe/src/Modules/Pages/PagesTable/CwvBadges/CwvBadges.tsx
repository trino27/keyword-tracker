import { Badge, Group, Text, Tooltip } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { CWV_METRICS, type IPageSpeedAvailability, type IPageSpeedSummary } from "@app/contracts";
import { cwvBandColor } from "@Core/Constants/cwvBandColor";
import { CWV_METRIC_NAME, cwvReadingSentence } from "@Core/Helpers/DescribeCwv/describeCwv";
import { pageSpeedViewOf } from "@Core/Helpers/DescribePageSpeed/describePageSpeed";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";

interface ICwvBadgesProps {
	pageSpeed: IPageSpeedSummary | null;
	availability: IPageSpeedAvailability;
	timeZone: string;
}

const NO_INP =
	"INP — no data. Google has no real-visitor measurement of responsiveness for this page or site.";

/**
 * A row's Core Web Vitals at a glance: LCP · INP · CLS, green, yellow or red, the value
 * and whose it is in the tooltip. Every absence says which absence it is.
 */
export function CwvBadges({ pageSpeed, availability, timeZone }: ICwvBadgesProps) {
	const view = pageSpeedViewOf(pageSpeed, availability);
	switch (view.kind) {
		case "notConfigured":
			return (
				<Text size="sm" c="dimmed" aria-label="PageSpeed not configured">
					—
				</Text>
			);
		case "notMeasured":
			return (
				<Text size="xs" c="dimmed">
					Not measured
				</Text>
			);
		case "queued":
			return (
				<Text size="xs" c="dimmed">
					In queue
				</Text>
			);
		case "measuring":
			return (
				<Text size="xs" c="dimmed">
					Measuring…
				</Text>
			);
		case "paused":
			return (
				<Text size="xs" c="dimmed">
					Paused
				</Text>
			);
		case "couldNotMeasure":
			return (
				<Tooltip label={`Couldn't measure: ${view.reason}`} withArrow multiline maw={280}>
					<Text size="xs" c="red">
						Couldn't measure
					</Text>
				</Tooltip>
			);
		case "measured": {
			const { measurement, refreshFailed } = view;
			return (
				<Group gap={4} wrap="nowrap">
					{CWV_METRICS.map((metric) => {
						const reading = measurement[metric];
						return (
							<Tooltip
								key={metric}
								label={
									reading
										? cwvReadingSentence(
												metric,
												reading,
												measurement.measuredAt,
												timeZone,
											)
										: NO_INP
								}
								withArrow
								multiline
								maw={300}
							>
								<Badge
									size="sm"
									variant="light"
									color={cwvBandColor[reading?.band ?? "noData"]}
									data-band={reading?.band ?? "noData"}
								>
									{CWV_METRIC_NAME[metric]}
								</Badge>
							</Tooltip>
						);
					})}
					{refreshFailed && (
						<Tooltip
							label={`Couldn't refresh: ${refreshFailed} Showing the measurement from ${formatInZone(measurement.measuredAt, timeZone, "shortDate")}.`}
							withArrow
							multiline
							maw={300}
						>
							<IconAlertTriangle
								size={14}
								aria-label="Couldn't refresh"
								color="var(--mantine-color-yellow-7)"
							/>
						</Tooltip>
					)}
				</Group>
			);
		}
	}
}
