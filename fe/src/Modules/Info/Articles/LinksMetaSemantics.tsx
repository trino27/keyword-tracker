import { Code, List, Table, Text } from "@mantine/core";
import { DoAvoid } from "../DoAvoid/DoAvoid";
import { GuideSection } from "../GuideSection/GuideSection";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

const ROBOTS_RULES = [
	{ rule: "all", means: "No restriction. The default — writing it changes nothing." },
	{ rule: "noindex", means: "Keep this page out of search results." },
	{ rule: "nofollow", means: "Do not follow the links on this page." },
	{ rule: "none", means: "Both noindex and nofollow." },
	{
		rule: "nosnippet",
		means: "Show no text snippet or video preview — and nothing from the page in AI Overviews.",
	},
	{
		rule: "max-snippet:[n]",
		means: "At most n characters of snippet; 0 means none, -1 lets Google choose.",
	},
	{
		rule: "max-image-preview:[none|standard|large]",
		means: "The largest image preview allowed. large is what Google Discover needs for big cards.",
	},
	{
		rule: "max-video-preview:[n]",
		means: "At most n seconds of video preview; 0 a still image, -1 no limit.",
	},
	{ rule: "noimageindex", means: "Do not index the images on this page." },
	{ rule: "notranslate", means: "Do not offer a translation of this result." },
	{
		rule: "indexifembedded",
		means: "With noindex, still allow the content to be indexed when embedded in another page's iframe.",
	},
	{
		rule: "unavailable_after:[date]",
		means: "Stop showing the page after this date (ignored if the date is invalid).",
	},
] as const;

const REL_VALUES = [
	{
		rel: "(none)",
		use: "A normal link you stand behind — the default for links within your site and to sources you cite.",
	},
	{ rel: "sponsored", use: "Paid placements and advertising." },
	{ rel: "ugc", use: "Links in user-generated content: comments, forum posts." },
	{
		rel: "nofollow",
		use: "A link you do not want associated with your site, when neither of the above fits. Not for your own pages.",
	},
] as const;

/** The meaning behind the words: topics, keyword clusters, intent, and markup that says what each part is. */
export function SemanticsSection() {
	return (
		<GuideSection
			section={S.semantics}
			sources={[
				SRC.rankingSystems,
				SRC.howSearchWorks,
				SRC.starterGuide,
				SRC.keywordClustering,
				SRC.searchIntent,
				SRC.spamPolicies,
				SRC.mdnSemantics,
			]}
		>
			<Text fw={600}>Search engines read meaning, not just words</Text>
			<Text>
				Google's language systems — BERT, RankBrain, neural matching and passage ranking —
				connect the concepts in a query with the concepts in a page and in each section of
				it. A page can rank for a search that never uses its exact words, and repeating a
				phrase does not make a page more relevant: keyword stuffing is a spam policy
				violation. What wins is a page that covers the meaning behind the query — the
				subject, its related ideas, and what the searcher wants to do.
			</Text>

			<Text fw={600}>The semantic core: the map of what a site answers</Text>
			<Text>
				A site's semantic core is the full set of queries it wants to be found for,
				organised by meaning. Built well, it decides which pages exist and what each one is
				about:
			</Text>
			<List type="ordered" size="sm" spacing={4}>
				<List.Item>
					<b>Collect queries</b> — the words customers use, the queries the site already
					appears for in Search Console, and those from a keyword tool.
				</List.Item>
				<List.Item>
					<b>Group them into clusters by intent.</b> Queries belong together when Google
					already answers them with the same pages: if the top results overlap, one page
					can serve the whole cluster.
				</List.Item>
				<List.Item>
					<b>One cluster, one page.</b> Give each cluster exactly one page. Two pages for
					one cluster compete with each other (cannibalisation); one page for two intents
					serves neither well.
				</List.Item>
				<List.Item>
					<b>Group clusters into topics.</b> A hub page covers the broad topic and links
					to the posts that cover each subtopic, and they link back — so both readers and
					Google see how the site's pages fit together.
				</List.Item>
				<List.Item>
					<b>Cover the topic, not the phrase.</b> Answer the related questions, name the
					things the topic involves, use the words a knowledgeable person would.
				</List.Item>
			</List>
			<Text size="sm">
				In this tracker, the <b>Keywords</b> column shows what each post signals it is
				about, read from its title, H1, URL and text. Compare it with the cluster the post
				was meant for: when they differ, the post is not saying what you think. Two posts
				leading with the same keyword are flagged as possible cannibalisation. The tracker
				does not do keyword research — it has no search volumes.
			</Text>

			<Text fw={600}>Semantic HTML: markup that says what each part is</Text>
			<Text>
				Semantic elements describe the role of content, not its look:{" "}
				<Code>&lt;h1&gt;</Code> is the main heading, <Code>&lt;main&gt;</Code> the page's
				own content, <Code>&lt;article&gt;</Code> a self-contained post,{" "}
				<Code>&lt;nav&gt;</Code> navigation, <Code>&lt;aside&gt;</Code> something beside the
				point, <Code>&lt;time&gt;</Code> a date. Screen readers navigate by them, developers
				find their way by them, and crawlers use them to tell the article from the furniture
				around it — this tracker reads the article that holds the H1 and leaves out nav,
				sidebars and related-post widgets when it extracts keywords.
			</Text>
			<Code block>
				{`<body>
  <header><nav>…site menu…</nav></header>
  <main>
    <article>
      <h1>Local SEO checklist</h1>
      <p>Updated <time datetime="2026-09-28">28 September 2026</time></p>
      <h2>Claim your Business Profile</h2>
      <figure><img src="/img/profile.png" alt="…"><figcaption>…</figcaption></figure>
    </article>
    <aside>Related posts…</aside>
  </main>
  <footer>…</footer>
</body>`}
			</Code>
			<DoAvoid
				good={[
					"Plan pages from clusters of queries with one intent each.",
					"Link each topic's hub and its supporting posts to each other.",
					"Write the way an expert explains the subject, covering its related questions.",
					"Use <article>, <main>, real headings and <time> for what they mean.",
				]}
				bad={[
					"One page per keyword variant (“seo audit”, “audit seo”, “seo audit guide”).",
					"Repeating the keyword to “signal relevance” — it is a spam signal.",
					"Headings made of styled <div>s and <span>s.",
					"Mixing two intents — a guide and a sales page — on one URL.",
				]}
			/>
		</GuideSection>
	);
}

/** Links within the site and out of it: what they do, how to write them, what this tracker checks. */
export function LinkingSection() {
	return (
		<GuideSection
			section={S.linking}
			sources={[
				SRC.crawlableLinks,
				SRC.qualifyLinks,
				SRC.canonical,
				SRC.starterGuide,
				SRC.wcagLinkPurpose,
			]}
		>
			<Text>
				Links are how Google discovers pages, how it learns what they are about, and —
				through link analysis and PageRank — how it judges which pages matter. Every link
				also tells a reader where to go next.
			</Text>

			<Text fw={600}>Internal links — between your own pages</Text>
			<List size="sm" spacing={4}>
				<List.Item>
					<b>Every page you care about needs a link from at least one other page.</b> A
					page reachable only through the sitemap (an orphan) is found late and looks
					unimportant.
				</List.Item>
				<List.Item>
					<b>Link from the text, in context.</b> A link inside a paragraph explains why
					the other page is relevant; navigation and footers repeat the same links on
					every page.
				</List.Item>
				<List.Item>
					<b>Build topic structure.</b> Hub page ↔ supporting posts, related posts linking
					to each other, breadcrumbs from the post up to its category.
				</List.Item>
				<List.Item>
					<b>Link to the final, canonical address</b> — https, the right host, no tracking
					parameters, no redirect in between. Every detour costs a request and blurs which
					URL is the real one.
				</List.Item>
				<List.Item>
					<b>Never nofollow your own pages</b>: it only withholds what the link would tell
					Google.
				</List.Item>
				<List.Item>
					Keep it useful: too many links make a page cluttered and each one worth less to
					the reader.
				</List.Item>
			</List>

			<Text fw={600}>Anchor text — the clickable words</Text>
			<Text size="sm">
				Google reads the anchor text as a description of the page it points to; for an image
				link it reads the alt text. Good anchor text is descriptive, reasonably short and
				relevant to both pages.
			</Text>
			<Code block>
				{`Good:  Read our <a href="/blog/local-seo-checklist/">local SEO checklist</a> before you start.
Bad:   To learn more, <a href="/blog/local-seo-checklist/">click here</a>.
Bad:   <a href="/blog/local-seo-checklist/">best local seo checklist local seo tips 2026</a>
Bad:   <span onclick="location='/blog/local-seo-checklist/'">checklist</span>`}
			</Code>

			<Text fw={600}>External links — to other sites</Text>
			<List size="sm" spacing={4}>
				<List.Item>
					<b>Cite your sources.</b> Linking to the research, data or documentation behind
					a claim builds trust with readers, and Google's helpful-content guidance names
					clear sourcing.
				</List.Item>
				<List.Item>
					<b>Qualify links, don't hide them.</b> Use nofollow only for sources you do not
					trust — not for every external link.
				</List.Item>
				<List.Item>
					<b>Keep them alive.</b> A link to a page that no longer exists sends readers to
					an error.
				</List.Item>
			</List>
			<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
				<Table.Thead>
					<Table.Tr>
						<Table.Th w={140}>rel</Table.Th>
						<Table.Th>Use it for</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{REL_VALUES.map((row) => (
						<Table.Tr key={row.rel}>
							<Table.Td>
								<Code>{row.rel}</Code>
							</Table.Td>
							<Table.Td>{row.use}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			<Text size="sm">
				Links <i>to</i> your site from others (backlinks) are covered under Beyond this
				tracker.
			</Text>

			<Text fw={600}>What this tracker checks</Text>
			<Text size="sm">
				In the article's own text: whether it links anywhere on the site (Content links
				nowhere on the site), whether those links are nofollow, point at a non-canonical
				variant, redirect or are broken, whether any link has no text, and whether a link is
				one Google cannot follow; for long posts, whether they cite any outside source.
				Navigation, sidebars and footers are not counted. See the Links and Content quality
				chapters of the check reference.
			</Text>
			<DoAvoid
				good={[
					"A few contextual links from each post to related posts and its hub page.",
					"Anchors that name the destination's subject.",
					"Links to the canonical https URL.",
					"Sources cited for facts, data and quotes.",
				]}
				bad={[
					"Orphan posts reachable only from the sitemap.",
					"“Click here”, “read more” or keyword-stuffed anchors.",
					"Links through old URLs that redirect, or with ?utm_ parameters.",
					"nofollow on internal links, or on every external link.",
				]}
			/>
		</GuideSection>
	);
}

/** Meta robots and X-Robots-Tag: the per-page rules for indexing and showing a page. */
export function MetaRobotsSection() {
	return (
		<GuideSection
			section={S.metaRobots}
			sources={[SRC.robotsMeta, SRC.blockIndexing, SRC.snippets, SRC.discover]}
		>
			<Text>
				The robots meta tag tells search engines, page by page, whether the page may be
				indexed and how it may be shown. It sits in <Code>&lt;head&gt;</Code>; the same
				rules can be sent as an <Code>X-Robots-Tag</Code> HTTP header, which is the only way
				for PDFs, images and other non-HTML files, and lets a server apply a rule to many
				URLs at once. With no tag at all, everything is allowed: the page may be indexed and
				Google picks the snippet.
			</Text>
			<Code block>
				{`<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="googlebot" content="notranslate">   <!-- Google only -->

HTTP/1.1 200 OK
X-Robots-Tag: noindex                              <!-- e.g. for a PDF -->`}
			</Code>
			<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
				<Table.Thead>
					<Table.Tr>
						<Table.Th w={260}>Rule</Table.Th>
						<Table.Th>Means</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{ROBOTS_RULES.map((row) => (
						<Table.Tr key={row.rule}>
							<Table.Td>
								<Code>{row.rule}</Code>
							</Table.Td>
							<Table.Td>{row.means}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			<Text size="sm" c="dimmed">
				Google ignores <Code>noarchive</Code>, <Code>nocache</Code> and{" "}
				<Code>nositelinkssearchbox</Code>: the features they controlled no longer exist.
				There is no <Code>index</Code> or <Code>follow</Code> to “turn on” — they are the
				default.
			</Text>
			<Text fw={600}>How the rules combine</Text>
			<List size="sm" spacing={4}>
				<List.Item>
					<b>The more restrictive rule wins.</b> max-snippet:50 and nosnippet together
					mean nosnippet.
				</List.Item>
				<List.Item>
					<b>Generic and Google-specific tags add up.</b> A robots nofollow plus a
					googlebot noindex means Googlebot treats the page as noindex, nofollow.
				</List.Item>
				<List.Item>
					<b>The page must be crawlable.</b> Google reads these rules only when it fetches
					the page; if robots.txt blocks it, a noindex is never seen.
				</List.Item>
				<List.Item>
					<b>data-nosnippet</b> on a span, div or section keeps just that text out of
					snippets.
				</List.Item>
			</List>
			<Text fw={600}>Typical uses</Text>
			<List size="sm" spacing={4}>
				<List.Item>
					Blog posts: no restriction; optionally max-image-preview:large for Discover.
				</List.Item>
				<List.Item>Internal search results, thank-you and cart pages: noindex.</List.Item>
				<List.Item>PDFs you do not want in search: X-Robots-Tag: noindex.</List.Item>
				<List.Item>Staging sites: password protection, not just noindex.</List.Item>
			</List>
			<Text fw={600}>What this tracker checks</Text>
			<Text size="sm">
				It reads the first robots and googlebot meta tags and the X-Robots-Tag header of
				every crawled post:
				<b> Page is set to noindex</b> (noindex, none, or a past unavailable_after) is
				Critical; <b>Search snippet is restricted</b> (nosnippet, max-snippet:0, or
				data-nosnippet around most of the article) and{" "}
				<b>Large image previews not allowed</b> are Improvements. A page-wide nofollow is
				not reported on its own.
			</Text>
			<DoAvoid
				good={[
					"Leave posts without restrictions unless there is a reason.",
					"Use noindex for pages with no search value, and keep them crawlable.",
					"Use X-Robots-Tag for files that cannot carry a meta tag.",
				]}
				bad={[
					"A noindex left on from staging or a plugin setting.",
					"noindex plus a robots.txt Disallow on the same URL — the noindex is never read.",
					"nosnippet on posts that need clicks: no description, no AI Overview quotes.",
					"A page-wide nofollow that cuts off every link on the page.",
				]}
			/>
		</GuideSection>
	);
}
