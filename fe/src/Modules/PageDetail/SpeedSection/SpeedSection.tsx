import {
	Alert,
	Badge,
	Code,
	Group,
	Paper,
	Progress,
	RingProgress,
	SegmentedControl,
	SimpleGrid,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { useState } from "react";
import {
	CWV_METRICS,
	type IPageSpeedAvailability,
	type ILcpBreakdown,
	type IPageSpeedMeasurement,
	type IPageSpeedSummary,
	type IVisitShare,
	type TCwvMetric,
	type TLcpPhase,
	type TPsiStrategy,
} from "@app/contracts";
import { cwvBandColor, cwvBandLabel } from "@Core/Constants/cwvBandColor";
import { pageSpeedAvailabilityCopy } from "@Core/Constants/pageSpeedAvailabilityCopy";
import {
	CWV_METRIC_NAME,
	cwvSourceLabel,
	formatCwvValue,
	formatTtfb,
	lcpPhaseShares,
	visitShareSentence,
} from "@Core/Helpers/DescribeCwv/describeCwv";
import { pageSpeedViewOf } from "@Core/Helpers/DescribePageSpeed/describePageSpeed";
import { formatInZone } from "@Core/Helpers/FormatInZone/formatInZone";

interface ISpeedSectionProps {
	/** Each device's measurement; null for a device the page was never queued on. */
	pageSpeedByStrategy: Record<TPsiStrategy, IPageSpeedSummary | null>;
	availability: IPageSpeedAvailability;
	timeZone: string;
}

const DEVICES: { value: TPsiStrategy; label: string }[] = [
	{ value: "mobile", label: "Mobile" },
	{ value: "desktop", label: "Desktop" },
];

const FULL_NAME: Record<TCwvMetric, string> = {
	lcp: "Largest Contentful Paint",
	inp: "Interaction to Next Paint",
	cls: "Cumulative Layout Shift",
};

/** A device the page was never queued on: crawled before that device was measured. */
const NOT_MEASURED: Record<TPsiStrategy, string> = {
	mobile: "This page has not been measured yet: it was crawled before speed measurement existed. The next crawl or seed run queues it.",
	desktop:
		"Not measured on desktop yet: this page was crawled before desktop measurement existed. The next crawl or seed run queues it.",
};

const STATE_SENTENCE = {
	queued: "In queue for measurement. Clients take turns, and pages are measured about five a minute, so a long queue can take an hour or more.",
	measuring: "Measuring… Google's PageSpeed test takes up to a minute per page.",
	paused: "Not measured yet, and paused until the PageSpeed key is fixed.",
} as const;

/**
 * The page's Core Web Vitals from Google PageSpeed Insights, on the device the switch
 * shows — mobile first: one card per metric with its value, band, source and date. Scored
 * apart from the SEO score, and every absence written as a sentence that says which
 * absence it is. The switch is local state: both measurements came with the page, so
 * switching asks for nothing.
 */
export function SpeedSection({ pageSpeedByStrategy, availability, timeZone }: ISpeedSectionProps) {
	const [strategy, setStrategy] = useState<TPsiStrategy>("mobile");
	const view = pageSpeedViewOf(pageSpeedByStrategy[strategy], availability);
	const notice = pageSpeedAvailabilityCopy[availability.state];

	return (
		<Stack gap="sm">
			<Group justify="space-between" align="center" gap="sm">
				<Title order={4}>Speed (Core Web Vitals)</Title>
				<SegmentedControl
					size="xs"
					data={DEVICES}
					value={strategy}
					onChange={setStrategy}
					aria-label="Device"
				/>
			</Group>
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
			{view.kind === "notMeasured" && (
				<Text size="sm" c="dimmed">
					{NOT_MEASURED[strategy]}
				</Text>
			)}
			{(view.kind === "queued" || view.kind === "measuring" || view.kind === "paused") && (
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
												{reading.share && (
													<VisitShareBar share={reading.share} />
												)}
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
					<TtfbLine measurement={view.measurement} />
					{view.measurement.lcpBreakdown && (
						<LcpBreakdown breakdown={view.measurement.lcpBreakdown} />
					)}
					<LighthouseScores measurement={view.measurement} strategy={strategy} />
				</>
			)}
		</Stack>
	);
}

/** How the visits split across Google's three bands, each share in words on hover. */
function VisitShareBar({ share }: { share: IVisitShare }) {
	const good = Math.round(share.good * 100);
	const poor = Math.round(share.poor * 100);
	return (
		<Tooltip label={visitShareSentence(share)} withArrow>
			<Progress.Root size="sm" aria-label={visitShareSentence(share)}>
				<Progress.Section value={good} color="teal" />
				<Progress.Section value={Math.max(0, 100 - good - poor)} color="yellow" />
				<Progress.Section value={poor} color="red" />
			</Progress.Root>
		</Tooltip>
	);
}

/**
 * Real visitors' time to first byte: a line of its own, not a fourth card — it is not a Core
 * Web Vital and Google does not rank on it. It tells a slow server from a heavy page.
 */
function TtfbLine({ measurement }: { measurement: IPageSpeedMeasurement }) {
	const { ttfb } = measurement;
	if (!ttfb)
		return (
			<Text size="sm" c="dimmed">
				Time to first byte: no data — Google has no real-visitor measurement for this page
				or site.
			</Text>
		);
	const band = cwvBandLabel[ttfb.band];
	return (
		<Stack gap={4}>
			<Text size="sm">
				{`Time to first byte (${cwvSourceLabel(ttfb.source).toLowerCase()}): ${formatTtfb(ttfb.value)} · ${band[0].toUpperCase()}${band.slice(1)}`}
			</Text>
			{ttfb.share && <VisitShareBar share={ttfb.share} />}
		</Stack>
	);
}

const PHASE_COLOR: Record<TLcpPhase, string> = {
	timeToFirstByte: "blue",
	resourceLoadDelay: "grape",
	resourceLoadDuration: "cyan",
	elementRenderDelay: "orange",
};

/**
 * Where the lab LCP's time went, as each phase's share (PAGEDETAIL-013). The phases come from
 * Lighthouse's unthrottled trace, so their milliseconds add up to no LCP shown above; only
 * their proportions are true of both, and only they are drawn.
 */
function LcpBreakdown({ breakdown }: { breakdown: ILcpBreakdown }) {
	const shares = lcpPhaseShares(breakdown);
	return (
		<Paper withBorder radius="md" p="md">
			<Stack gap={6}>
				<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
					Where the LCP's time went · lab
				</Text>
				<Progress.Root size="lg">
					{shares.map(({ phase, name, percent }) => (
						<Tooltip key={phase} label={`${name}: ${percent}%`} withArrow>
							<Progress.Section value={percent} color={PHASE_COLOR[phase]} />
						</Tooltip>
					))}
				</Progress.Root>
				<Group gap="md">
					{shares.map(({ phase, name, percent }) => (
						<Text key={phase} size="xs" c={PHASE_COLOR[phase]}>
							{`${name} ${percent}%`}
						</Text>
					))}
				</Group>
				{breakdown.element && (
					<Text size="xs" c="dimmed">
						Largest element: <Code>{breakdown.element.selector}</Code>
					</Text>
				)}
				<Text size="xs" c="dimmed">
					From Lighthouse's lab run without throttling: the shares say which phase to work
					on, and the times behind them do not add up to the LCP shown above.
				</Text>
			</Stack>
		</Paper>
	);
}

/**
 * Lighthouse's own colours for a category score: 0–49 poor, 50–89 needs improvement,
 * 90–100 good — so a 47 reads as Lighthouse shows it in PageSpeed Insights.
 */
const lighthouseColor = (score: number) =>
	score >= 90
		? cwvBandColor.good
		: score >= 50
			? cwvBandColor.needsImprovement
			: cwvBandColor.poor;

/**
 * Lighthouse's category scores as cards: the number in a ring, coloured by Lighthouse's
 * bands. Lab figures from one run on the device shown — said once, under them — and never
 * part of our SEO score, which counts Lighthouse's audits rather than its averages. A
 * desktop measurement asks for performance alone, so it has no SEO or accessibility card.
 */
function LighthouseScores({
	measurement,
	strategy,
}: {
	measurement: IPageSpeedMeasurement;
	strategy: TPsiStrategy;
}) {
	const scores = [
		{ name: "Performance", score: measurement.performanceScore },
		{ name: "SEO", score: measurement.seoScore },
		{ name: "Accessibility", score: measurement.accessibilityScore },
	].filter((entry): entry is { name: string; score: number } => entry.score !== null);
	return (
		<Stack gap={6}>
			<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
				Lighthouse scores · lab
			</Text>
			<SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
				{scores.map(({ name, score }) => (
					<Paper key={name} withBorder radius="md" p="md">
						<Group gap="md" wrap="nowrap">
							<RingProgress
								size={72}
								thickness={7}
								roundCaps
								sections={[{ value: score, color: lighthouseColor(score) }]}
								label={
									<Text
										ta="center"
										fw={700}
										fz={20}
										c={lighthouseColor(score)}
										className="tabular"
									>
										{score}
									</Text>
								}
								aria-label={`Lighthouse ${name} score ${score} of 100`}
							/>
							<Stack gap={0}>
								<Text fw={600}>{name}</Text>
								<Text size="xs" c="dimmed">
									{`${score}/100`}
								</Text>
							</Stack>
						</Group>
					</Paper>
				))}
			</SimpleGrid>
			<Text size="xs" c="dimmed">
				From one Lighthouse run on a {strategy === "mobile" ? "phone" : "computer"}, as
				PageSpeed Insights tests the page — a lab test that may vary between runs. Our SEO
				score counts Lighthouse&apos;s audits, not these averages.
			</Text>
		</Stack>
	);
}
