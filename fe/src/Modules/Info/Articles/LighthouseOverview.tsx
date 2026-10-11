import { Code, Stack, Table, Text } from "@mantine/core";
import { SCORED_LIGHTHOUSE_CODES } from "@Core/Constants/checkTopics";
import { lighthouseComparisonRows } from "@ViewModels/InfoGuideViewModel/Services/BuildCheckGuide/buildCheckGuide";
import { GuideSection } from "../GuideSection/GuideSection";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const ROWS = lighthouseComparisonRows();

const SIDE_BY_SIDE = [
	{
		aspect: "What it reads",
		crawl: "The HTML and headers exactly as the server sends them, without running JavaScript — what any crawler that does not render sees.",
		lighthouse:
			"The page rendered in a mobile Chrome, after its JavaScript has run — close to what Googlebot sees after rendering.",
	},
	{
		aspect: "How much of the page",
		crawl: "Most checks read the article's main content only; navigation, sidebars and footers are left out on purpose.",
		lighthouse: "The whole rendered page, theme, menus and footer included.",
	},
	{
		aspect: "Who asks",
		crawl: "This tracker's crawler, under its own name, obeying robots.txt.",
		lighthouse: "Google's PageSpeed Insights servers, as a phone.",
	},
	{
		aspect: "When",
		crawl: "On every crawl.",
		lighthouse:
			"Right after each crawl, at most once every 24 hours per page, and only with a PageSpeed key configured.",
	},
	{
		aspect: "Who decides",
		crawl: "The tracker's own rules, with the thresholds and sources in its catalogue.",
		lighthouse: "Lighthouse's own SEO audits; the tracker records the verdict as it is.",
	},
	{
		aspect: "In the score",
		crawl: "Yes, each check weighed by its level.",
		lighthouse:
			"Yes, added to the crawl's points the same way. A page not yet measured by Lighthouse is scored on the crawl alone.",
	},
] as const;

/** What Lighthouse is, how it differs from the crawl, and every pair of checks that overlap. */
export function LighthouseOverview() {
	return (
		<GuideSection
			section={S.lighthouseOverview}
			sources={[SRC.pageSpeedInsights, SRC.javascriptSeo]}
		>
			<Text>
				Lighthouse is Google's open-source page auditor, the engine behind PageSpeed
				Insights and the Lighthouse panel in Chrome DevTools. Besides speed, it scores SEO,
				accessibility and best-practice categories. The tracker runs it through PageSpeed
				Insights and records the audits Lighthouse scores in its SEO category —{" "}
				{SCORED_LIGHTHOUSE_CODES.length} today — as checks of its own. Accessibility is
				shown only as Lighthouse's overall score in a page's Speed block: its audits are not
				checks here (see the next chapter for why).
			</Text>
			<Text fw={600}>Lighthouse and our crawl, side by side</Text>
			<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
				<Table.Thead>
					<Table.Tr>
						<Table.Th w={150} />
						<Table.Th>Our crawl</Table.Th>
						<Table.Th>Lighthouse</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{SIDE_BY_SIDE.map((row) => (
						<Table.Tr key={row.aspect}>
							<Table.Td fw={600}>{row.aspect}</Table.Td>
							<Table.Td>{row.crawl}</Table.Td>
							<Table.Td>{row.lighthouse}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			<Text>
				That is why the two can disagree about the same page, and why both are kept: a title
				set by JavaScript passes Lighthouse and fails our check, which is exactly what a
				crawler without JavaScript would see; an image without alt text in the footer fails
				Lighthouse and not our check of the article. Neither is wrong — they answer
				different questions.
			</Text>
			<Text fw={600}>Where Lighthouse and our checks overlap</Text>
			<Table withTableBorder withColumnBorders verticalSpacing={8} fz="sm">
				<Table.Thead>
					<Table.Tr>
						<Table.Th w={190}>Lighthouse audit</Table.Th>
						<Table.Th w={210}>Our check</Table.Th>
						<Table.Th>How they differ</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{ROWS.map((row) => (
						<Table.Tr key={row.audit.code}>
							<Table.Td>
								<Stack gap={2}>
									<Text size="sm">{row.audit.label}</Text>
									<Code fz="xs">{row.audit.code}</Code>
								</Stack>
							</Table.Td>
							<Table.Td>
								<Stack gap={4}>
									{row.ours.map((ours) => (
										<Stack gap={2} key={ours.code}>
											<Text size="sm">{ours.label}</Text>
											<Code fz="xs">{ours.code}</Code>
										</Stack>
									))}
								</Stack>
							</Table.Td>
							<Table.Td>{row.text}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
		</GuideSection>
	);
}
