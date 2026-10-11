import { Badge, Group, List, Table, Text } from "@mantine/core";
import {
	CWV_BANDS,
	CWV_METRICS,
	CWV_SOURCES,
	CWV_THRESHOLDS,
	type TCwvMetric,
} from "@app/contracts";
import { cwvBandColor, cwvBandLabel } from "@Core/Constants/cwvBandColor";
import { pageSpeedAvailabilityCopy } from "@Core/Constants/pageSpeedAvailabilityCopy";
import {
	CWV_METRIC_NAME,
	cwvSourceLabel,
	formatCwvValue,
} from "@Core/Helpers/DescribeCwv/describeCwv";
import { DoAvoid } from "../DoAvoid/DoAvoid";
import { GuideSection } from "../GuideSection/GuideSection";
import { GuidePart } from "../GuidePart/GuidePart";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const METRIC_ABOUT: Record<TCwvMetric, { full: string; measures: string }> = {
	lcp: { full: "Largest Contentful Paint", measures: "Loading — when the main content appears" },
	inp: {
		full: "Interaction to Next Paint",
		measures: "Responsiveness — how fast the page reacts",
	},
	cls: { full: "Cumulative Layout Shift", measures: "Visual stability — how much content jumps" },
};

const SOURCE_MEANING = {
	url: "Chrome users who visited this exact page over the last 28 days. The best evidence: it is what readers really got.",
	origin: "The page has too few visits of its own, so Google reports all visitors to the whole site. Real, but not about this page alone.",
	lab: "No real-visitor data, so one Lighthouse test on a simulated phone. It varies from run to run and cannot measure INP.",
} as const;

/** Part four: the three Core Web Vitals — what each measures, what makes it bad, how to fix it. */
export function CoreWebVitalsGuide() {
	return (
		<GuidePart
			title="Core Web Vitals"
			lead="Google's three measures of how a page feels to a real visitor, and how this tracker reads them."
		>
			<GuideSection
				section={S.cwv}
				sources={[
					SRC.webVitals,
					SRC.coreWebVitals,
					SRC.pageExperience,
					SRC.pageSpeedInsights,
				]}
			>
				<Text>
					Core Web Vitals measure the experience of loading and using a page, from real
					Chrome users. Each has three bands. A page passes when all three are good at the{" "}
					<b>75th percentile</b> — that is, for at least three visits out of four —
					measured separately for mobile and desktop.
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Metric</Table.Th>
							<Table.Th>Measures</Table.Th>
							{CWV_BANDS.map((band) => (
								<Table.Th key={band}>
									<Badge color={cwvBandColor[band]} variant="light">
										{cwvBandLabel[band]}
									</Badge>
								</Table.Th>
							))}
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{CWV_METRICS.map((metric) => {
							const { good, poor } = CWV_THRESHOLDS[metric];
							return (
								<Table.Tr key={metric}>
									<Table.Td fw={600}>
										{CWV_METRIC_NAME[metric]}
										<Text size="xs" c="dimmed">
											{METRIC_ABOUT[metric].full}
										</Text>
									</Table.Td>
									<Table.Td>{METRIC_ABOUT[metric].measures}</Table.Td>
									<Table.Td className="tabular">
										≤ {formatCwvValue(metric, good)}
									</Table.Td>
									<Table.Td className="tabular">
										{formatCwvValue(metric, good)} –{" "}
										{formatCwvValue(metric, poor)}
									</Table.Td>
									<Table.Td className="tabular">
										&gt; {formatCwvValue(metric, poor)}
									</Table.Td>
								</Table.Tr>
							);
						})}
					</Table.Tbody>
				</Table>
				<Text fw={600}>How much they matter</Text>
				<Text>
					Google says good Core Web Vitals align with what its ranking systems reward and
					recommends achieving them — but it ranks the most relevant page first even when
					its experience is worse. Treat them as a small ranking signal and a large user
					one: readers who wait, mis-tap or lose their place leave.
				</Text>
				<Text size="sm" c="dimmed">
					INP replaced First Input Delay (FID) as a Core Web Vital in 2024. Time to First
					Byte and First Contentful Paint are useful diagnostics but not Core Web Vitals.
				</Text>
			</GuideSection>

			<GuideSection
				section={S.lcp}
				sources={[SRC.lcp, SRC.optimizeLcp, SRC.lcpLazyLoading, SRC.ttfb]}
			>
				<Text>
					<b>What it measures:</b> the time from starting to load the page until the
					largest image or text block in the visible area has rendered — the moment a
					reader sees the page has loaded. Candidates are images, video posters, CSS
					background images and blocks of text; on a blog post it is usually the featured
					image or the headline. Recording stops once the reader interacts.
				</Text>
				<Text fw={600}>Where the time goes</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						<Table.Tr>
							<Table.Td fw={600} w={200}>
								Time to First Byte
							</Table.Td>
							<Table.Td>
								Until the first byte of HTML arrives: redirects, DNS, connection,
								the server's own work. Good is 0.8 s or less.
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td fw={600}>Resource load delay</Table.Td>
							<Table.Td>
								Until the browser starts fetching the LCP image — long when it is
								lazy-loaded or only discovered by a script or stylesheet.
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td fw={600}>Resource load duration</Table.Td>
							<Table.Td>
								Downloading the image itself — long when it is oversized or
								uncompressed.
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td fw={600}>Element render delay</Table.Td>
							<Table.Td>
								Until it is painted — held back by render-blocking CSS, synchronous
								scripts in &lt;head&gt;, long JavaScript tasks.
							</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
				<DoAvoid
					good={[
						"Serve the featured image at the size it is shown, in WebP or AVIF, compressed.",
						'Put the LCP image in the HTML as an <img>, with fetchpriority="high".',
						"Use a CDN and caching so the HTML and image arrive fast.",
						"Defer scripts and keep critical CSS small.",
						"Redirect old URLs straight to the final one.",
					]}
					bad={[
						'loading="lazy" on the featured image at the top of the post.',
						"A hero image set only as a CSS background or injected by JavaScript.",
						"Several-megabyte images scaled down by the browser.",
						"Synchronous third-party scripts in <head>.",
						"Content that only appears after client-side JavaScript runs.",
					]}
				/>
			</GuideSection>

			<GuideSection section={S.inp} sources={[SRC.inp, SRC.optimizeInp, SRC.domSize]}>
				<Text>
					<b>What it measures:</b> how long the page takes to show a visible response
					after a click, a tap or a key press, across the whole visit. The worst
					interaction is reported (ignoring one outlier per 50 interactions). Scrolling
					and hovering do not count; a visit without any interaction has no INP — which is
					why a lab test cannot measure it.
				</Text>
				<Text fw={600}>Where the time goes</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Input delay</b> — the main thread is busy (often with scripts still
						loading) when the reader taps.
					</List.Item>
					<List.Item>
						<b>Processing</b> — the page's own event handlers take long to run.
					</List.Item>
					<List.Item>
						<b>Presentation delay</b> — the browser takes long to recalculate styles,
						lay out and paint the result; a huge DOM makes this slow.
					</List.Item>
				</List>
				<DoAvoid
					good={[
						"Break long JavaScript tasks into small ones and yield to the main thread.",
						"Show the visual response first, do the rest of the work after.",
						"Keep the DOM small; render off-screen content lazily.",
						"Audit third-party scripts (ads, chat, analytics, A/B testing) and load them late.",
					]}
					bad={[
						"Heavy scripts running during load, when readers start to tap.",
						"Handlers that read layout right after changing styles (layout thrashing).",
						"Thousands of elements, or large chunks of HTML rendered by JavaScript.",
					]}
				/>
			</GuideSection>

			<GuideSection section={S.cls} sources={[SRC.cls, SRC.optimizeCls, SRC.bfcache]}>
				<Text>
					<b>What it measures:</b> how much visible content moves unexpectedly. Each shift
					scores how much of the screen moved times how far; shifts less than a second
					apart are grouped into windows of at most 5 seconds, and CLS is the worst
					window. It has no unit. A shift within half a second of a reader's tap or key
					press does not count — the reader caused it.
				</Text>
				<DoAvoid
					good={[
						"Give every image, video and embed width and height (or an aspect-ratio).",
						"Reserve space for ads, banners and embeds before they load.",
						"Put late-loading content below what is being read, or overlay it.",
						"Animate with transform, not top/left/height.",
						"Match the fallback font's size to the web font (size-adjust), or use font-display: optional.",
						"Let pages use the back/forward cache, so returning to them does not reflow them.",
					]}
					bad={[
						"Images without dimensions.",
						"Cookie banners, newsletter bars or ads that push the article down.",
						"Content inserted above the reader's position without them asking.",
						"Web fonts that swap in at a different size and reflow the text.",
					]}
				/>
			</GuideSection>

			<GuideSection
				section={S.speedHere}
				sources={[SRC.pageSpeedInsights, SRC.coreWebVitals]}
			>
				<Text>
					After each crawl, every page is measured with Google PageSpeed Insights, for{" "}
					<b>mobile</b>, at most once every 24 hours. For each metric the tracker keeps
					the best evidence Google has, and says whose it is:
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						{CWV_SOURCES.map((source) => (
							<Table.Tr key={source}>
								<Table.Td fw={600} w={220}>
									{cwvSourceLabel(source)}
								</Table.Td>
								<Table.Td>{SOURCE_MEANING[source]}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Group gap="xs">
					{CWV_BANDS.map((band) => (
						<Badge key={band} color={cwvBandColor[band]} variant="light">
							{cwvBandLabel[band]}
						</Badge>
					))}
					<Badge color={cwvBandColor.noData} variant="light">
						no data
					</Badge>
				</Group>
				<List size="sm" spacing={4}>
					<List.Item>
						A metric outside the good band becomes an issue: <b>Improvement</b> while it
						needs improvement, <b>Important</b> once it is poor. These issues never
						change the SEO score.
					</List.Item>
					<List.Item>
						The <b>performance score</b> under the Speed block is Lighthouse's lab score
						(0–100) from the same run — a caption, not a Core Web Vital.
					</List.Item>
					<List.Item>
						A grey INP badge usually means Google has no real-visitor data: the page and
						the site have too little Chrome traffic.
					</List.Item>
					<List.Item>
						States you may see: <i>In queue</i> (waiting its turn), <i>Measuring…</i>{" "}
						(Google is testing it), <i>Couldn't measure</i> (Google could not load the
						page), <i>Not measured</i> (never queued), and an old measurement kept with
						a note when a refresh failed.
					</List.Item>
					{Object.values(pageSpeedAvailabilityCopy).map(
						(copy) =>
							copy && (
								<List.Item key={copy.short}>
									<b>{copy.short}</b> — {copy.notice}
								</List.Item>
							),
					)}
				</List>
				<Text size="sm" c="dimmed">
					Not measured here: desktop, Time to First Byte and First Contentful Paint as
					separate numbers, and the site-wide Core Web Vitals report in Search Console.
				</Text>
			</GuideSection>
		</GuidePart>
	);
}
