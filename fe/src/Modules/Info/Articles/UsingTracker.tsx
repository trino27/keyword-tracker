import { Badge, Code, Group, List, Table, Text, Timeline } from "@mantine/core";
import {
	IconBrain,
	IconChartLine,
	IconFileSearch,
	IconGauge,
	IconListCheck,
	IconSitemap,
	IconUserPlus,
} from "@tabler/icons-react";
import { CRAWL_CANDIDATE_LIMIT, CRAWL_POST_LIMIT } from "@app/contracts";
import { crawlStatusColor, crawlStatusLabel } from "@Core/Constants/crawlStatusColor";
import { GuideSection } from "../GuideSection/GuideSection";
import { GuidePart } from "../GuidePart/GuidePart";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const RUN_STATUS_MEANING = {
	queued: "Waiting for the crawler to pick the run up.",
	running: "Finding the sitemap and reading posts right now.",
	succeeded: "Every step finished; the pages and issues on screen are from this run.",
	partial: "Some posts could not be read. The rest are analysed; the run log says which and why.",
	failed: "Nothing could be analysed — the banner and the run log say why (site blocked, no blog sitemap, robots.txt forbids it…).",
} as const;

/** Part one: what the tracker does with a client, step by step, and how each screen reads. */
export function UsingTracker() {
	return (
		<GuidePart
			title="Using this tracker"
			lead="What happens after you add a client, and where each result appears."
		>
			<GuideSection
				section={S.howItWorks}
				sources={[SRC.sitemaps, SRC.robotsSpec, SRC.pageSpeedInsights]}
			>
				<Text>
					The tracker audits the blog of each client's website the way a search engine
					would read it, and keeps the result per page: likely keywords, rank positions,
					SEO issues and a score, plus Google's speed measurement.
				</Text>
				<Timeline active={7} bulletSize={26} lineWidth={2}>
					<Timeline.Item bullet={<IconUserPlus size={14} />} title="1. You add a client">
						<Text c="dimmed" size="sm">
							A name and a website address on the Clients screen. A crawl starts at
							once; Re-crawl runs it again later.
						</Text>
					</Timeline.Item>
					<Timeline.Item
						bullet={<IconSitemap size={14} />}
						title="2. The blog sitemap is found"
					>
						<Text c="dimmed" size="sm">
							The crawler reads robots.txt (and obeys it under its own name), collects
							the sitemaps it lists or the usual addresses, and picks the one that
							looks like the blog — by its name (blog, post, article, news), by how
							many URLs sit under /blog/, /news/ or /articles/, and by how much of the
							site's RSS feed it contains. Without a sitemap it falls back to the feed
							or a blog index page.
						</Text>
					</Timeline.Item>
					<Timeline.Item
						bullet={<IconFileSearch size={14} />}
						title={`3. The first ${CRAWL_POST_LIMIT} posts are read`}
					>
						<Text c="dimmed" size="sm">
							Entries are taken in sitemap order: up to {CRAWL_POST_LIMIT} posts,
							considering at most {CRAWL_CANDIDATE_LIMIT} entries. An entry that is
							not a post — another site, a listing page, a file, a page robots.txt
							forbids, an error, or a page with too few words to be an article — is
							skipped, and the run log says why.
						</Text>
					</Timeline.Item>
					<Timeline.Item
						bullet={<IconListCheck size={14} />}
						title="4. Every page is checked"
					>
						<Text c="dimmed" size="sm">
							Each post's HTML and headers go through every page check (title,
							canonical, robots rules, images, links, structured data…). Some checks
							compare the posts with each other — duplicate titles, near-duplicate
							text, two posts with the same top keyword. Then the site itself is
							checked once: robots.txt, the sitemap, the host's redirects, a made-up
							address, the home page's name and icon.
						</Text>
					</Timeline.Item>
					<Timeline.Item
						bullet={<IconBrain size={14} />}
						title="5. Keywords are extracted"
					>
						<Text c="dimmed" size="sm">
							From the page's own text — where a phrase appears (title, H1, URL,
							headings, body) and how often — the tracker infers the few phrases each
							post is about. See Keywords below.
						</Text>
					</Timeline.Item>
					<Timeline.Item
						bullet={<IconGauge size={14} />}
						title="6. Speed is measured by Google"
					>
						<Text c="dimmed" size="sm">
							When the crawl finishes, its pages join a queue for Google PageSpeed
							Insights, once for mobile and once for desktop. A page measured on a
							device in the last 24 hours is not measured on it again. Results arrive
							within minutes and the badges fill in on their own.
						</Text>
					</Timeline.Item>
					<Timeline.Item
						bullet={<IconChartLine size={14} />}
						title="7. Positions are recorded"
					>
						<Text c="dimmed" size="sm">
							Each keyword gets a daily rank position. In this version positions are{" "}
							<b>simulated</b>, not taken from Google — see Positions below.
						</Text>
					</Timeline.Item>
				</Timeline>
				<Text fw={600} mt="sm">
					Crawl statuses
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						{(
							Object.keys(RUN_STATUS_MEANING) as (keyof typeof RUN_STATUS_MEANING)[]
						).map((status) => (
							<Table.Tr key={status}>
								<Table.Td w={130}>
									<Badge color={crawlStatusColor[status]} variant="light">
										{crawlStatusLabel[status]}
									</Badge>
								</Table.Td>
								<Table.Td>{RUN_STATUS_MEANING[status]}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Text size="sm" c="dimmed">
					The crawler never disguises itself. A site that refuses automated requests, or a
					robots.txt that forbids the blog, ends the run as failed rather than being
					worked around.
				</Text>
			</GuideSection>

			<GuideSection section={S.screens}>
				<Text fw={600}>Pages</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Score</b> — the page's SEO score in its band colour, with the checks it
						came from (e.g. "14/16 checks"). The list is ordered worst first, so what
						needs work is on top.
					</List.Item>
					<List.Item>
						<b>Keywords</b> — what the page is about, with each keyword's latest
						position.
					</List.Item>
					<List.Item>
						<b>Best position</b> — the page's highest-ranking keyword, coloured Top 3 /
						Top 10 / Top 20 / below.
					</List.Item>
					<List.Item>
						<b>LCP · INP · CLS</b> — the three Core Web Vitals coloured by Google's
						band: green good, yellow needs improvement, red poor, grey no data. The
						tooltip says the value, whose experience it is and when it was measured.
					</List.Item>
					<List.Item>
						<b>Issues</b> — counts by level; "2 site-wide" means two of the findings are
						shared by other pages of the client, usually one template fix. Clicking the
						counts opens the Issues report for that page.
					</List.Item>
				</List>
				<Text fw={600}>A page's detail</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Header</b> — the URL, the crawl time, and the response time of our one
						fetch. That time is our crawler's network, not the page's speed, so it is
						never an issue and never scored.
					</List.Item>
					<List.Item>
						<b>Health score and "How this score is calculated"</b> — the score worked
						out on this page's own numbers.
					</List.Item>
					<List.Item>
						<b>Speed</b> — LCP, INP and CLS with value, band and source, plus
						Lighthouse's lab performance score as a caption.
					</List.Item>
					<List.Item>
						<b>Position history</b> — a chart (position 1 at the top) and a table with
						each keyword's latest position, change, best and worst over the chosen
						range.
					</List.Item>
					<List.Item>
						<b>Issues</b> — grouped Critical, Important, Improvement, each with what to
						do; "on 5 of 15 pages" means it is a site-wide pattern.
					</List.Item>
					<List.Item>
						<b>Checks</b> — every check with its outcome on this page: passed, failed,
						not applicable (with the reason) or not yet checked.
					</List.Item>
				</List>
				<Text fw={600}>Issues</Text>
				<Text size="sm">
					Every problem across a client — or all clients — in plain words: what is wrong,
					why it costs traffic, what to do and whom to ask, with the technical details
					folded underneath. Group by issue (one card per problem, listing every page that
					has it) or by page; filter by level, by type (SEO, Speed, Site) and by URL.
				</Text>
				<Text fw={600}>Clients</Text>
				<Text size="sm">
					Add a client, see each crawl's status, re-crawl, and open the <b>run log</b>:
					which sitemap was chosen and why, and every entry considered in sitemap order
					with what happened to it — <Code>Crawled</Code>, <Code>Listing page</Code>,{" "}
					<Code>Blocked by robots.txt</Code>, <Code>Not a page</Code>,{" "}
					<Code>Other site</Code> or <Code>Failed</Code>.
				</Text>
				<Group gap="xs">
					<Text size="sm" c="dimmed">
						All times are shown in your own time zone (see the account menu).
					</Text>
				</Group>
			</GuideSection>
		</GuidePart>
	);
}
