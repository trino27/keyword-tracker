import { Table, Text } from "@mantine/core";
import { GuideSection } from "../GuideSection/GuideSection";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const OVERLAP = [
	[
		"Alt text on images",
		"Google reads it to understand images for image search, and as the anchor text of a linked image.",
	],
	[
		"Descriptive link text",
		"Google reads a link's words as a description of the page it points to.",
	],
	["A <title> on every page", "The main source of the headline in search results."],
	["Real <a href> links", "The only links Google reliably follows to discover pages."],
	[
		"Clear headings and main content",
		"Help Google understand the page; separating main content is one of Google's page-experience questions.",
	],
	[
		"Captions and text for media",
		"Give search engines text where they would otherwise have only a video or an image.",
	],
] as const;

/** Whether accessibility is an SEO factor — what Google says, and where the two overlap anyway. */
export function AccessibilityAndSeo() {
	return (
		<GuideSection
			section={S.accessibilitySeo}
			sources={[
				SRC.pageExperience,
				SRC.images,
				SRC.crawlableLinks,
				SRC.titleLinks,
				SRC.wcagLanguage,
			]}
		>
			<Text>
				<b>Not directly.</b> Google's page-experience documentation names Core Web Vitals,
				HTTPS, mobile display, ads and interstitials, and a clear main content — not
				accessibility — and says there is no single page-experience signal. Google publishes
				no statement that an accessibility score is a ranking factor, and Lighthouse's
				accessibility score is not one.
			</Text>
			<Text>
				<b>But much of it is the same work.</b> Many accessibility fixes are things Google
				documents as helping it understand a page:
			</Text>
			<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
				<Table.Tbody>
					{OVERLAP.map(([fix, seo]) => (
						<Table.Tr key={fix}>
							<Table.Td w={230} fw={600}>
								{fix}
							</Table.Td>
							<Table.Td>{seo}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			<Text>
				<b>And some of it is not SEO at all.</b> Colour contrast, ARIA, form labels,
				tap-target size and keyboard order matter to the people who use the site, not to
				Google's ranking. Google even says it ignores the lang attribute and decides the
				language from the text. That is why this tracker does not score Lighthouse's
				accessibility audits: the SEO ones count as checks, and accessibility is shown only
				as Lighthouse's overall score in a page's Speed block — worth improving for
				visitors, not a ranking lever.
			</Text>
			<Text size="sm" c="dimmed">
				Indirectly, a page people cannot use loses readers, links and recommendations — and
				in many countries accessibility is a legal requirement in its own right.
			</Text>
		</GuideSection>
	);
}
