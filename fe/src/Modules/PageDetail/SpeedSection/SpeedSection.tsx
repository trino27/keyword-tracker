import { Alert, Badge, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import {
	CWV_METRICS,
	type IPageSpeedAvailability,
	type IPageSpeedSummary,
	type TCwvMetric,
} from "@app/contracts";
import { cwvBandColor, cwvBandLabel } from "@Core/Constants/cwvBandColor";
import { pageSpeedAvailabilityCopy } from "@Core/Constants/pageSpeedAvailabilityCopy";
import {
	CWV_METRIC_NAME,
	cwvSourceLabel,
	formatCwvValue,
} from "@Core/Helpers/DescribeCwv/describeCwv";
import { pageSpeedViewOf } from "@Core/Helpers/DescribePageSpeed/describePageSpeed";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";

interface ISpeedSectionProps {
	pageSpeed: IPageSpeedSummary | null;
	availability: IPageSpeedAvailability;
	timeZone: string;
}

const FULL_NAME: Record<TCwvMetric, string> = {
	lcp: "Largest Contentful Paint",
	inp: "Interaction to Next Paint",
	cls: "Cumulative Layout Shift",
};

const STATE_SENTENCE = {
	notMeasured:
		"This page has not been measured yet: it was crawled before speed measurement existed. The next crawl or seed run queues it.",
	measuring: "Measuring… Google's PageSpeed test takes up to a minute per page.",
	paused: "Not measured yet, and paused until the PageSpeed key is fixed.",
} as const;

/**
 * The page's Core Web Vitals, mobile, from Google PageSpeed Insights: one card per metric
 * with its value, band, source and date. Scored apart from the SEO score, and every
 * absence written as a sentence that says which absence it is.
 */
export function SpeedSection({ pageSpeed, availability, timeZone }: ISpeedSectionProps) {
	const view = pageSpeedViewOf(pageSpeed, availability);
	const notice = pageSpeedAvailabilityCopy[availability.state];

	return (
		<Stack gap="sm">
			<Title order={4}>Speed (Core Web Vitals, mobile)</Title>
			{notice && (
				<Alert variant="light" color={notice.color} icon={<IconInfoCircle size={18} />}>
					{notice.notice}
				</Alert>
			)}
			{view.kind === "couldNotMeasure" && (
				<Alert variant="light" color="red" icon={<IconAlertTriangle size={18} />}>
					Couldn't measure: {view.reason}
				</Alert>
			)}
			{(view.kind === "notMeasured" ||
				view.kind === "measuring" ||
				view.kind === "paused") && (
				<Text size="sm" c="dimmed">
					{STATE_SENTENCE[view.kind]}
				</Text>
			)}
			{view.kind === "measured" && (
				<>
					{view.refreshFailed && (
						<Alert
							variant="light"
							color="yellow"
							icon={<IconAlertTriangle size={18} />}
						>
							Couldn't refresh: {view.refreshFailed} Showing the measurement from{" "}
							{formatInZone(view.measurement.measuredAt, timeZone)}.
						</Alert>
					)}
					<SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
						{CWV_METRICS.map((metric) => {
							const reading = view.measurement[metric];
							return (
								<Paper key={metric} withBorder radius="md" p="md">
									<Stack gap={6}>
										<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
											{CWV_METRIC_NAME[metric]} · {FULL_NAME[metric]}
										</Text>
										{reading ? (
											<>
												<Text
													fz={24}
													fw={700}
													className="tabular"
													c={cwvBandColor[reading.band]}
												>
													{formatCwvValue(metric, reading.value)}
												</Text>
												<Badge
													variant="light"
													color={cwvBandColor[reading.band]}
													w="fit-content"
												>
													{cwvBandLabel[reading.band]}
												</Badge>
												<Text size="xs" c="dimmed">
													{cwvSourceLabel(reading.source)}, measured{" "}
													{formatInZone(
														view.measurement.measuredAt,
														timeZone,
													)}
												</Text>
											</>
										) : (
											<Text size="sm" c="dimmed">
												No data — Google has no real-visitor measurement of
												responsiveness for this page or site.
											</Text>
										)}
									</Stack>
								</Paper>
							);
						})}
					</SimpleGrid>
					<Text size="xs" c="dimmed">
						Lighthouse performance score (lab): {view.measurement.performanceScore}/100
						— a lab test, it may vary between runs.
					</Text>
				</>
			)}
		</Stack>
	);
}
