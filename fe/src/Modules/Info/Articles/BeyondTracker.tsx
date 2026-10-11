import { Code, List, Table, Text } from "@mantine/core";
import { DoAvoid } from "../DoAvoid/DoAvoid";
import { GuideSection } from "../GuideSection/GuideSection";
import { GuidePart } from "../GuidePart/GuidePart";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const INTENTS = [
	{
		intent: "Informational",
		wants: "To learn or get an answer",
		example: "how to write a meta description",
		page: "Guide, how-to, explainer",
	},
	{
		intent: "Commercial",
		wants: "To compare before buying",
		example: "best seo audit tools",
		page: "Comparison, review, list",
	},
	{
		intent: "Transactional",
		wants: "To act or buy now",
		example: "seo audit service price",
		page: "Product, pricing or sign-up page",
	},
	{
		intent: "Navigational",
		wants: "To reach a known site",
		example: "search console login",
		page: "That site's own page",
	},
] as const;

const SEARCH_CONSOLE = [
	{
		report: "Performance",
		tells: "The real queries a site appears for, with clicks, impressions, CTR (clicks ÷ impressions) and average position, by page, country and device.",
	},
	{
		report: "Page indexing",
		tells: "Which pages are indexed, which are not, and why — the place to confirm a noindex or canonical problem.",
	},
	{
		report: "URL Inspection",
		tells: "One URL's index status, the canonical Google chose, a live test, and a request to recrawl.",
	},
	{
		report: "Core Web Vitals",
		tells: "Field data grouped across the whole site, for mobile and desktop.",
	},
	{ report: "Sitemaps", tells: "Submit a sitemap and see how Google read it." },
	{ report: "Manual actions", tells: "Whether a reviewer has penalised the site, and where." },
] as const;

/** Part six: the SEO this tracker does not measure, so a reader knows where its view ends. */
export function BeyondTracker() {
	return (
		<GuidePart
			title="Beyond this tracker"
			lead="What also decides rankings but this tracker does not analyse — so you know where its picture ends and what to look at next."
		>
			<GuideSection
				section={S.keywordResearch}
				sources={[SRC.starterGuide, SRC.searchIntent, SRC.helpfulContent]}
			>
				<Text>
					The tracker infers what each post <i>is</i> about. Keyword research asks the
					question before writing: what do people search, how often, and what do they want
					when they do? It needs search data — query volumes from a keyword tool, and the
					queries you already appear for in Search Console.
				</Text>
				<Text fw={600}>Search intent</Text>
				<Text>
					Every query has a purpose, and the page that ranks is the one that serves it.
					Look at the current top results: the content type (post, product page, video),
					its format (how-to, list, comparison) and its angle (beginner, recent year) show
					what Google believes the searcher wants.
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Intent</Table.Th>
							<Table.Th>The searcher wants</Table.Th>
							<Table.Th>Example query</Table.Th>
							<Table.Th>Page that fits</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{INTENTS.map((row) => (
							<Table.Tr key={row.intent}>
								<Table.Td fw={600}>{row.intent}</Table.Td>
								<Table.Td>{row.wants}</Table.Td>
								<Table.Td>
									<Code>{row.example}</Code>
								</Table.Td>
								<Table.Td>{row.page}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<DoAvoid
					good={[
						"Write in the words your readers use — Google's starter guide asks you to anticipate them.",
						"Match the format of what already ranks for the query.",
						"Target specific, longer phrases where a small site can answer best.",
						"One page per intent; link related pages to each other.",
					]}
					bad={[
						"Writing a blog post for a query whose results are all product pages.",
						"Chasing high-volume terms the site cannot credibly answer.",
						"Choosing topics only because they trend, not because they fit your readers.",
					]}
				/>
			</GuideSection>

			<GuideSection
				section={S.links}
				sources={[
					SRC.rankingSystems,
					SRC.qualifyLinks,
					SRC.spamPolicies,
					SRC.manualActions,
				]}
			>
				<Text>
					Links from other sites (backlinks) are one of the signals Google's link analysis
					and PageRank use to judge what a page is about and how useful it is. The tracker
					reads only links on your own pages; it cannot see who links to you. Backlink
					tools and Search Console's Links report can.
				</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						What a link tells Google depends on where it comes from and the words it is
						made of — a page that links to you because it found you useful says more
						than a link placed to be counted.
					</List.Item>
					<List.Item>
						Paid links must be marked <Code>rel="sponsored"</Code>, user content{" "}
						<Code>rel="ugc"</Code>, and links you do not vouch for{" "}
						<Code>rel="nofollow"</Code>.
					</List.Item>
					<List.Item>
						Buying links, link exchanges and automated link building are link spam, and
						"unnatural links" is a reason for a manual action.
					</List.Item>
				</List>
				<DoAvoid
					good={[
						"Publish things worth citing: original data, research, tools, clear guides.",
						"Earn mentions through PR, partnerships and genuine community participation.",
					]}
					bad={[
						"Buying links or unmarked sponsored posts.",
						"Mass guest posting or link exchanges for the link's sake.",
					]}
				/>
			</GuideSection>

			<GuideSection section={S.eeat} sources={[SRC.helpfulContent, SRC.bylineDates]}>
				<Text>
					E-E-A-T — <b>experience, expertise, authoritativeness and trust</b> — is how
					Google describes what its systems try to recognise in content. Trust matters
					most. It is not a ranking factor in itself; it is what many signals add up to.
				</Text>
				<Text>Google suggests asking three questions of every page:</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Who</b> created it? Is the author evident, with a byline leading to who
						they are?
					</List.Item>
					<List.Item>
						<b>How</b> was it made? Say how a test was run, where data came from,
						whether automation was used.
					</List.Item>
					<List.Item>
						<b>Why</b> does it exist? To help people — not mainly to attract search
						visits.
					</List.Item>
				</List>
				<Text size="sm">
					The tracker sees the visible traces — an author named, author markup, sources
					cited, dates that agree — but not the expertise itself.
				</Text>
				<DoAvoid
					badTitle="Signs of search-engine-first content"
					good={[
						"First-hand experience: you used the product, ran the test, visited the place.",
						"Named authors with a page about them, and sources for claims.",
						"Updating a post when the facts change — and saying so.",
					]}
					bad={[
						"Covering many topics in the hope some will rank.",
						"Summarising others' work without adding anything.",
						"Changing the date without changing the content.",
						"Leaving readers needing to search again.",
					]}
				/>
			</GuideSection>

			<GuideSection
				section={S.searchConsole}
				sources={[SRC.searchConsole, SRC.performanceReport]}
			>
				<Text>
					Google Search Console is Google's own free view of a site in search. It shows
					what this tracker cannot: real queries, real clicks and Google's verdict on each
					URL. Positions here are simulated; there they are measured.
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						{SEARCH_CONSOLE.map((row) => (
							<Table.Tr key={row.report}>
								<Table.Td fw={600} w={160}>
									{row.report}
								</Table.Td>
								<Table.Td>{row.tells}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Text size="sm">
					A useful habit: when a check here flags a Critical issue, confirm it in URL
					Inspection, fix it, then ask Google to recrawl the URL.
				</Text>
			</GuideSection>

			<GuideSection section={S.local} sources={[SRC.localRanking]}>
				<Text>
					For businesses serving a place, the map and local results are ranked on three
					things: <b>relevance</b> (how well the Business Profile matches the search),{" "}
					<b>distance</b> (how far the business is from the searcher) and{" "}
					<b>prominence</b> (how well known it is — links, reviews, ratings). There is no
					way to pay for a better local ranking.
				</Text>
				<DoAvoid
					good={[
						"Claim and verify the Google Business Profile.",
						"Keep address, hours, category and attributes complete and current.",
						"Reply to reviews; add photos.",
					]}
					bad={["Leaving the profile unclaimed or out of date.", "Ignoring reviews."]}
				/>
			</GuideSection>

			<GuideSection section={S.migrations} sources={[SRC.siteMove, SRC.redirects]}>
				<Text>
					Changing domain, moving to HTTPS or restructuring URLs is where sites lose most
					traffic by accident. Google's procedure:
				</Text>
				<List type="ordered" size="sm" spacing={4}>
					<List.Item>Map every old URL to its new one.</List.Item>
					<List.Item>
						Update canonicals, hreflang and internal links on the new site to the new
						URLs.
					</List.Item>
					<List.Item>
						Redirect each old URL with a permanent (301/308) server-side redirect,
						without chains.
					</List.Item>
					<List.Item>
						For a new domain, use Search Console's Change of Address tool.
					</List.Item>
					<List.Item>
						Submit the new sitemap; keep the redirects for at least a year.
					</List.Item>
					<List.Item>Watch both sites in Search Console.</List.Item>
				</List>
				<Text size="sm">
					Expect rankings to fluctuate for a few weeks on a medium site, longer on a large
					one. After a move, re-crawl the client here to catch broken canonicals and
					redirect chains.
				</Text>
			</GuideSection>

			<GuideSection
				section={S.updates}
				sources={[SRC.coreUpdates, SRC.manualActions, SRC.spamPolicies]}
			>
				<Text fw={600}>Core updates</Text>
				<Text>
					Several times a year Google changes its ranking systems broadly. They do not
					target a site, and there is no quick fix for a drop: compare the weeks before
					and after in Search Console, review the most affected pages against Google's
					helpful-content questions, and improve them for readers. Recovery can take
					months — sometimes until the next core update.
				</Text>
				<Text fw={600}>Manual actions</Text>
				<Text>
					A manual action is a penalty from a human reviewer for breaking the spam
					policies — unnatural links, thin content, cloaking or sneaky redirects, hidden
					text or keyword stuffing, structured data abuse, user-generated spam. Some or
					all of the site stops appearing. It is shown in Search Console's Manual actions
					report; fix every affected page, then request a review.
				</Text>
			</GuideSection>

			<GuideSection
				section={S.aiSearch}
				sources={[
					SRC.aiFeatures,
					SRC.snippets,
					SRC.openAiBots,
					SRC.perplexityBots,
					SRC.claudeBots,
					SRC.javascriptSeo,
				]}
			>
				<Text>
					Google's AI Overviews and AI Mode draw on the same index as Search. There are no
					extra requirements or special markup: a page must be indexed and allowed to show
					a snippet, and the usual SEO fundamentals apply. <Code>nosnippet</Code>,{" "}
					<Code>max-snippet</Code> and <Code>noindex</Code> limit what is shown there too.
				</Text>
				<Text>
					Other assistants — ChatGPT, Perplexity, Claude, Copilot through Bing — search
					with their own crawlers. They must be allowed in robots.txt to cite a page, and
					most do not run JavaScript, so the text must be in the HTML. Their search
					crawlers are separate from their training crawlers; blocking training does not
					remove a site from their answers.
				</Text>
				<Text size="sm">
					The tracker checks both: robots.txt rules for the AI search crawlers, and posts
					that need JavaScript to show their text. It does not measure how often a site is
					cited in AI answers.
				</Text>
			</GuideSection>
		</GuidePart>
	);
}
