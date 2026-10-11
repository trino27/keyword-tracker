import { Badge, Code, Group, List, Table, Text } from "@mantine/core";
import {
	SCORE_BANDS,
	SEO_ISSUE_SEVERITIES,
	SEVERITY_WEIGHT,
	type TScoreBand,
	type TSeoIssueSeverity,
} from "@app/contracts";
import { POSITION_SOURCE } from "@Core/Constants/positionSource";
import { severityLabel } from "@Core/Constants/severityLabel";
import { positionBucket } from "@Core/Helpers/PositionBucket/positionBucket";
import { scoreFactsOf } from "@ViewModels/InfoGuideViewModel/Services/BuildCheckGuide/buildCheckGuide";
import {
	scoreExamples,
	type IScoreScenario,
} from "@ViewModels/InfoGuideViewModel/Services/ScoreExample/scoreExample";
import { DoAvoid } from "../DoAvoid/DoAvoid";
import { GuideSection } from "../GuideSection/GuideSection";
import { GuidePart } from "../GuidePart/GuidePart";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const FACTS = scoreFactsOf();
const EXAMPLES = scoreExamples();

const BAND_COLOR: Record<TScoreBand, string> = { poor: "red", average: "yellow", good: "teal" };
const BAND_MEANING: Record<TScoreBand, string> = {
	poor: "Serious technical defects — usually a Critical failure or many Important ones. Fix these first.",
	average: "No blocker, but several things hold the page back.",
	good: "No obvious technical defects. Spend the effort on content, not markup.",
};

/** The positions the rank-tracker convention cuts at, with a sample position in each. */
const BUCKET_SAMPLES = [1, 7, 15, 35, null] as const;

/** Part two: how a check concludes, what the levels mean, how the score, keywords and positions work. */
export function HowPagesAreJudged() {
	return (
		<GuidePart
			title="How pages are judged"
			lead="What every number and colour on the Pages and page screens means, and how it is computed."
		>
			<GuideSection section={S.outcomes}>
				<Text>Every check concludes one of four things about a page:</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						<Table.Tr>
							<Table.Td w={170}>
								<Badge color="teal" variant="light">
									Passed
								</Badge>
							</Table.Td>
							<Table.Td>
								The page meets the rule. Counts in the score as points kept.
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>
								<Badge color="red" variant="light">
									Failed
								</Badge>
							</Table.Td>
							<Table.Td>
								The page breaks the rule. It becomes an issue with what to do, and
								costs the check's points.
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>
								<Badge color="gray" variant="light">
									Not applicable
								</Badge>
							</Table.Td>
							<Table.Td>
								The rule has nothing to judge — no images for the alt-text check, no
								title to measure. Left out of the score entirely: the page is
								neither rewarded nor punished. The reason is shown beside it.
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>
								<Badge color="gray" variant="outline">
									Not yet checked
								</Badge>
							</Table.Td>
							<Table.Td>
								The check was added after this page was crawled. The next crawl
								judges it.
							</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
				<Text>
					Checks come from five places. <b>Per page</b> checks judge a page by itself;{" "}
					<b>across the crawl</b> checks compare it with the other posts of the same crawl
					(duplicate titles, near-duplicate text); <b>Lighthouse audits</b> are Google
					Lighthouse's own SEO verdicts from the PageSpeed measurement. All three count in
					the page's score — the crawl's and Lighthouse's points are added together, each
					check weighed by its level, and a page measured by Lighthouse is judged out of
					more points than one that is not yet. <b>Google measurement</b> findings (Core
					Web Vitals) and <b>whole site</b> checks (robots.txt, sitemap, host) appear as
					issues but never change a page's score.
				</Text>
				<Text>
					Today a crawl runs {FACTS.crawlChecks} checks on every page, Lighthouse scores
					up to {FACTS.lighthouseChecks} audits, Google's measurement can add{" "}
					{FACTS.speedFindings} speed findings, and {FACTS.siteChecks} checks judge the
					site. Some crawl checks and Lighthouse audits look at the same thing — a missing
					title, alt text, a canonical — on purpose: two independent readings, each
					counted on its own side.
				</Text>
			</GuideSection>

			<GuideSection section={S.severity}>
				<Text>
					Every check has one level, fixed in the catalogue — the level does not change
					with how badly a page fails. It answers one question: what happens to the page
					in search if this is not fixed?
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Level</Table.Th>
							<Table.Th>Means</Table.Th>
							<Table.Th>Worth in the score</Table.Th>
							<Table.Th>Page checks</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{SEO_ISSUE_SEVERITIES.map((severity) => (
							<Table.Tr key={severity}>
								<Table.Td>
									<Badge color={severityLabel[severity].color} variant="light">
										{severityLabel[severity].label}
									</Badge>
								</Table.Td>
								<Table.Td>{severityLabel[severity].rubric}</Table.Td>
								<Table.Td className="tabular">
									{SEVERITY_WEIGHT[severity]} points
								</Table.Td>
								<Table.Td className="tabular">
									{FACTS.bySeverity[severity]}
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Text>
					Fix in that order. A Critical failure (noindex, robots.txt blocking Googlebot,
					no title, plain HTTP) can cost all of the page's search traffic; an Improvement
					is good practice worth doing once the rest is done. Where only an industry
					source backs a check, it is never more than an Improvement.
				</Text>
			</GuideSection>

			<GuideSection section={S.score} sources={[SRC.starterGuide, SRC.searchEssentials]}>
				<Text>
					The score is the share of the applicable checks' points the page kept, from 0 to
					100:
				</Text>
				<Code block>
					score = round( 100 × (points possible − points lost) ÷ points possible )
				</Code>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Points possible</b> — every check that applied to the page, each worth
						its level:{" "}
						{SEO_ISSUE_SEVERITIES.map(
							(severity) =>
								`${severityLabel[severity].label} ${SEVERITY_WEIGHT[severity]}`,
						).join(", ")}
						. If every check applied it would be {FACTS.pointsIfAllApply}; in practice
						it is less, because checks that do not apply are left out.
					</List.Item>
					<List.Item>
						<b>Points lost</b> — the same weights, for the checks the page failed.
					</List.Item>
					<List.Item>
						Rounded half-up. A page that passes everything that applied scores 100,
						whichever checks those were.
					</List.Item>
				</List>
				<Text fw={600}>Worked example</Text>
				<Text>
					A post where {describeCounts(EXAMPLES.minor.applicable)} checks applied — worth{" "}
					{EXAMPLES.minor.score.pointsPossible} points.
				</Text>
				<ScenarioTable scenarios={[EXAMPLES.minor, EXAMPLES.critical]} />
				<Text>
					Both pages fail {EXAMPLES.minor.score.failed} checks, but one Critical failure
					costs far more than an Important one. This is deliberate: a broken canonical
					should not score better than three missing alt texts.
				</Text>
				<Text fw={600}>Bands</Text>
				<Group gap="sm">
					{SCORE_BANDS.map((band, index) => {
						const from = index === 0 ? 0 : SCORE_BANDS[index - 1].max + 1;
						return (
							<Badge
								key={band.band}
								color={BAND_COLOR[band.band]}
								variant="light"
								size="lg"
							>
								{from}–{band.max} {band.band}
							</Badge>
						);
					})}
				</Group>
				<List size="sm" spacing={4}>
					{SCORE_BANDS.map((band) => (
						<List.Item key={band.band}>
							<b>{band.band[0].toUpperCase() + band.band.slice(1)}</b> —{" "}
							{BAND_MEANING[band.band]}
						</List.Item>
					))}
				</List>
				<Text>
					The thresholds are Lighthouse's, so a number you have seen in PageSpeed Insights
					reads the same way here.
				</Text>
				<Text fw={600}>What the score is not</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						Not a ranking or traffic prediction. Google ranks on relevance and quality
						first; a 100 means no obvious technical defects, not "will rank".
					</List.Item>
					<List.Item>
						Not a judgement of the writing — no check reads whether the content is good.
					</List.Item>
					<List.Item>
						Not speed. Core Web Vitals are shown and listed as issues, but scored
						separately, the way Lighthouse keeps SEO and Performance apart.
					</List.Item>
					<List.Item>
						Always read it with its denominator: 100 from 30 applicable checks and 100
						from 55 are not the same claim.
					</List.Item>
				</List>
				<DoAvoid
					goodTitle="Raising a score"
					badTitle="Wasted effort"
					good={[
						"Fix Critical, then Important issues first — they are worth most.",
						'Fix issues marked "site-wide" in the template: one change fixes every page.',
						"Re-crawl after the fix; the score is recomputed from the new crawl.",
					]}
					bad={[
						"Chasing the last Improvement on one page while another page has a Critical issue.",
						"Deleting images or links to make a conditional check stop applying — the score ignores, it does not reward, what is absent.",
						"Expecting rankings to follow the score by themselves.",
					]}
				/>
			</GuideSection>

			<GuideSection
				section={S.keywords}
				sources={[
					SRC.starterGuide,
					SRC.titleLinks,
					SRC.helpfulContent,
					SRC.spamPolicies,
					SRC.cannibalisation,
				]}
			>
				<Text>
					Keywords here are what each post is about, inferred from its own text — the
					phrases a searcher would type to find it. They are not search volumes,
					difficulty or the queries a page actually gets impressions for; only search data
					(see Search Console) shows those.
				</Text>
				<Text fw={600}>How they are chosen</Text>
				<List type="ordered" size="sm" spacing={4}>
					<List.Item>
						<b>Only the article.</b> The text inside the article that holds the H1.
						Navigation, sidebars, related-post widgets, newsletter boxes and comments
						are cut, so other posts' subjects never become this post's keywords.
					</List.Item>
					<List.Item>
						<b>Candidate phrases</b> of one to a few words that never begin or end with
						a stop word ("the", "of", "and"). The site's own name is removed, and so is
						a title tail repeated across the site ("… | Blog").
					</List.Item>
					<List.Item>
						<b>Scored by where they appear</b>: title 5, H1 4, URL slug 3, meta
						description 2, H2/H3 2, first paragraph 1.5, and the body by how often (2.5
						× ln(1 + occurrences)). Appearing in several deliberate places adds 25% per
						extra place; a keyword the page declares itself (JSON-LD{" "}
						<Code>keywords</Code>, <Code>article:tag</Code>) adds 15%.
					</List.Item>
					<List.Item>
						<b>Adjusted</b>: a lone word is damped against a phrase; a word used on most
						posts of the site fades (it describes the site, not the post); a title
						phrase the text never repeats counts half; a short word gives way to a
						longer phrase that contains it and says more.
					</List.Item>
					<List.Item>
						<b>Kept</b>: the best ones that score at least a fifth of the top one, no
						two overlapping by more than half their words, at most two from one
						sentence. A short post keeps up to two, and every 400 words of text earns
						one more, up to six. A post about one thing keeps one.
					</List.Item>
				</List>
				<Text>
					<b>Relevance</b> is a keyword's score divided by the top keyword's: 1 for the
					main keyword, lower for the secondary ones.
				</Text>
				<DoAvoid
					good={[
						"Name the main topic in the title, the H1 and the URL, in the words searchers use.",
						"Use the phrase and its variations naturally in the text, especially early.",
						"Give each post one clear subject — and give two posts two different subjects.",
						"Write headings that say what each section is about.",
					]}
					bad={[
						"Keyword stuffing — repeating a phrase unnaturally; Google's spam policies name it.",
						"Two posts leading with the same keyword: they compete for one query (see Keyword cannibalisation).",
						"Clever titles that never name the subject.",
						"Writing for a keyword at the expense of the reader — Google's systems reward people-first content.",
					]}
				/>
			</GuideSection>

			<GuideSection
				section={S.positions}
				sources={[SRC.howSearchWorks, SRC.performanceReport]}
			>
				<Text>
					A position is where a page ranks for one keyword: 1 is the first organic result.
					Each keyword gets one position per day, and the page's <b>best position</b> is
					its highest-ranking keyword.
				</Text>
				<Text c="orange.8" fw={600}>
					Positions in this version are {POSITION_SOURCE}: generated, not taken from
					Google. Use them to learn the screens, not to make decisions.
				</Text>
				<Group gap="sm">
					{BUCKET_SAMPLES.map((position) => {
						const bucket = positionBucket(position);
						return (
							<Badge key={bucket.label} color={bucket.color} variant="light">
								{bucket.label}
							</Badge>
						);
					})}
				</Group>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Top 3</b> — the results most searchers see and click. <b>Top 10</b> — the
						first page. <b>Top 20</b> — the second page, within reach of a good update.{" "}
						<b>Below 20</b> — rarely seen.
					</List.Item>
					<List.Item>
						<b>Change</b> — places gained over the range: positive is better (the number
						got smaller).
						<b> Best</b> and <b>worst</b> are the extremes over the chosen range.
					</List.Item>
					<List.Item>
						The chart puts position 1 at the top, so a line going up is good.
					</List.Item>
				</List>
				<Text>
					Real positions are not one number: Google ranks for each search, and the user's
					location, language and device change the results. That is why tools such as
					Search Console report an <i>average</i> position.
				</Text>
			</GuideSection>
		</GuidePart>
	);
}

const describeCounts = (counts: Record<TSeoIssueSeverity, number>) =>
	SEO_ISSUE_SEVERITIES.map(
		(severity) => `${counts[severity]} ${severityLabel[severity].label}`,
	).join(", ");

function ScenarioTable({ scenarios }: { scenarios: IScoreScenario[] }) {
	return (
		<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Fails</Table.Th>
					<Table.Th>Points lost</Table.Th>
					<Table.Th>Arithmetic</Table.Th>
					<Table.Th>Score</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{scenarios.map(({ failed, score }) => (
					<Table.Tr key={describeCounts(failed)}>
						<Table.Td>{describeCounts(failed)}</Table.Td>
						<Table.Td className="tabular">{score.pointsLost}</Table.Td>
						<Table.Td className="tabular">
							100 × {score.pointsPossible - score.pointsLost} ÷ {score.pointsPossible}
						</Table.Td>
						<Table.Td className="tabular" fw={700}>
							{score.value}
						</Table.Td>
					</Table.Tr>
				))}
			</Table.Tbody>
		</Table>
	);
}
