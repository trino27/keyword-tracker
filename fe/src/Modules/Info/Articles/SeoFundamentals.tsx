import { Code, List, Table, Text } from "@mantine/core";
import { DoAvoid } from "../DoAvoid/DoAvoid";
import { GuideSection } from "../GuideSection/GuideSection";
import { GuidePart } from "../GuidePart/GuidePart";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";
import {
	CrawlIndexInDepth,
	OnPageInDepth,
	RobotsTxtInDepth,
	SignalsInDepth,
} from "./FundamentalsInDepth";
import { LinkingSection, MetaRobotsSection, SemanticsSection } from "./LinksMetaSemantics";

const STAGES = [
	{
		stage: "Crawling",
		what: "Googlebot downloads pages. There is no central list of the web: it finds URLs by following links from pages it knows and by reading sitemaps. It does not crawl every URL it finds, limits its speed to spare the server, and runs the page's JavaScript in a recent Chrome.",
		wrong: "robots.txt forbids the URL, the server errors or refuses, the page is only reachable through links Google cannot follow, or the content needs JavaScript that fails.",
		checks: "Indexing and robots rules, Links, Site: robots.txt, Site: host and server",
	},
	{
		stage: "Indexing",
		what: "Google reads the text, the key tags (title, headings, canonical, robots), images and video. It groups duplicate pages and picks one canonical per group — only that one can be shown. It also records the language, the country targeted and usability.",
		wrong: "A noindex rule, a canonical pointing elsewhere, near-duplicate pages, thin or low-quality content, or markup that contradicts itself.",
		checks: "Indexing and robots rules, Canonical URLs, Content quality, Structured data",
	},
	{
		stage: "Serving and ranking",
		what: "For each search Google finds matching pages in the index and orders them by expected relevance and quality, using hundreds of signals including the searcher's location, language and device.",
		wrong: "The page does not answer the query, other pages answer it better, or a spam policy demotes it.",
		checks: "Titles, Meta descriptions, Headings, Keywords — and everything this tracker cannot see (see Beyond this tracker).",
	},
] as const;

const ON_PAGE = [
	{
		element: "Title (<title>)",
		does: "The headline of the search result; read to understand the page.",
		good: "Unique, specific, names the subject first, roughly 30–60 characters, brand at the end.",
		bad: "Missing, duplicated across pages, vague (“Home”, “Blog”), stuffed with keywords.",
	},
	{
		element: "Meta description",
		does: "May be shown as the snippet under the headline. Not a ranking factor.",
		good: "A unique, accurate summary of this page that makes the click worthwhile.",
		bad: "Missing, the same on every page, a copy of the title, a list of keywords.",
	},
	{
		element: "Headings (H1–H6)",
		does: "The page's outline for readers, screen readers and Google.",
		good: "One H1 naming the topic; H2s for sections that say what each covers.",
		bad: "The title styled as a <div>; headings used for font size; one wall of text.",
	},
	{
		element: "Content",
		does: "What ranks. Google's systems reward helpful, reliable, people-first content.",
		good: "Answers the searcher's question completely, from real experience, with sources.",
		bad: "Thin stubs, copies of other pages, text written for a keyword rather than a reader.",
	},
	{
		element: "Internal links",
		does: "How Google discovers pages and learns what they are about (the anchor text).",
		good: "Descriptive links from the text to related posts, to their canonical URLs.",
		bad: "“Click here”, links only in menus, onclick-only links, nofollow on your own pages.",
	},
	{
		element: "Canonical URL",
		does: "Tells Google which of several copies of a page is the one to show.",
		good: 'An absolute <link rel="canonical"> to the page itself, in <head>, once.',
		bad: "Missing, pointing to another page by mistake, two different canonicals, http://.",
	},
	{
		element: "Structured data",
		does: "States facts (headline, author, dates, image, breadcrumbs) in JSON-LD; enables rich results.",
		good: "Valid JSON-LD that matches what is visible on the page.",
		bad: "Broken JSON, fields that contradict the page, markup for content that is not there.",
	},
	{
		element: "Images",
		does: "Found in image search; make text readable; need text for those who cannot see them.",
		good: "Descriptive alt text and file names, a real src, near the related text.",
		bad: "No alt attribute, IMG_1234.jpg, images only in srcset or CSS backgrounds.",
	},
	{
		element: "URL",
		does: "Shown in results and breadcrumbs; a light clue to the page's subject.",
		good: "Short, readable words separated by hyphens: /blog/local-seo-checklist.",
		bad: "Session IDs, long parameter strings, several URLs for one page.",
	},
] as const;

const STATUS_CODES = [
	{ code: "200 OK", google: "The content is processed. It does not guarantee indexing." },
	{
		code: "301 / 308",
		google: "Permanent redirect: a strong signal the target is the page to show. Google shows the new URL.",
	},
	{
		code: "302 / 307",
		google: "Temporary redirect: a weak signal. Google keeps showing the old URL. Use only for short-term moves.",
	},
	{
		code: "404 / 410",
		google: "The page does not exist. Google drops it from the index over time and crawls it less. Harmless for a page that really is gone.",
	},
	{
		code: "429",
		google: "Treated as an overloaded server, like a 5xx: Google slows down. Do not use 401/403 to limit crawling.",
	},
	{
		code: "5xx",
		google: "Server error: Google slows crawling; pages that keep failing are eventually dropped from the index.",
	},
	{
		code: "Soft 404",
		google: "A 200 for a page that looks like an error or is empty. Google reports it as a soft 404 — answer a real 404 instead.",
	},
] as const;

/** Part three: the SEO a reader needs to understand every check — how search works and what ranks. */
export function SeoFundamentals() {
	return (
		<GuidePart
			title="SEO fundamentals"
			lead="How search engines find, understand and rank pages — the background every check rests on."
		>
			<GuideSection
				section={S.howSearchWorks}
				sources={[SRC.howSearchWorks, SRC.googlebot, SRC.javascriptSeo, SRC.sitemaps]}
			>
				<Text>
					Google Search works in three stages, and a page can drop out at each. Most
					technical SEO is making sure nothing stops a page at the first two.
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={8} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={120}>Stage</Table.Th>
							<Table.Th>What happens</Table.Th>
							<Table.Th>What goes wrong</Table.Th>
							<Table.Th w={190}>Checked here by</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{STAGES.map((row) => (
							<Table.Tr key={row.stage}>
								<Table.Td fw={600}>{row.stage}</Table.Td>
								<Table.Td>{row.what}</Table.Td>
								<Table.Td>{row.wrong}</Table.Td>
								<Table.Td c="dimmed">{row.checks}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<List size="sm" spacing={4}>
					<List.Item>
						Google does not accept payment to crawl a site more often or to rank it
						higher.
					</List.Item>
					<List.Item>
						Nothing guarantees that a page is crawled, indexed or shown — even a page
						that follows every guideline.
					</List.Item>
					<List.Item>
						A page can be indexed and still not appear: it may not be relevant to
						anything people search, or be of low quality.
					</List.Item>
				</List>
			</GuideSection>

			<CrawlIndexInDepth />

			<GuideSection
				section={S.ranking}
				sources={[
					SRC.rankingSystems,
					SRC.helpfulContent,
					SRC.starterGuide,
					SRC.pageExperience,
					SRC.spamPolicies,
				]}
			>
				<Text>
					Google ranks with many automated systems, not one formula, and publishes no
					weights. The ones that matter most to a blog post, as Google's own guide
					describes them:
				</Text>
				<List type="ordered" size="sm" spacing={6}>
					<List.Item>
						<b>Relevance to the search.</b> Language systems (BERT, RankBrain, neural
						matching, passage ranking) match the meaning of the query to the meaning of
						the page — and of individual sections of it — not just its words. A page
						that does not answer what the searcher wants does not rank, however good its
						markup.
					</List.Item>
					<List.Item>
						<b>Helpful, reliable content.</b> Systems that reward original, people-first
						content written with real expertise, and promote authoritative sources.
						Google's self-assessment questions ask: who wrote it, how, and why.
					</List.Item>
					<List.Item>
						<b>Links.</b> Link analysis and PageRank use how pages link to each other to
						understand what they are about and how useful they are. Links from other
						sites are one of many signals.
					</List.Item>
					<List.Item>
						<b>Freshness</b> — for searches where recent information is expected (news,
						new releases).
					</List.Item>
					<List.Item>
						<b>Page experience</b> — Core Web Vitals, HTTPS, mobile-friendliness, no
						intrusive pop-ups. It aligns with what the ranking systems reward, but
						Google shows the most relevant page even when its experience is worse.
					</List.Item>
					<List.Item>
						<b>Spam detection.</b> Pages that break the spam policies (keyword stuffing,
						cloaking, link schemes, scaled low-value content) are demoted or removed.
					</List.Item>
				</List>
				<Text>
					Results are also de-duplicated (near-identical pages are hidden) and usually
					show at most two pages from one site.
				</Text>
				<DoAvoid
					goodTitle="What Google says matters"
					badTitle="What Google says not to focus on"
					good={[
						"Content that fully answers the searcher's need, better than the alternatives.",
						"Clear expertise: who wrote it, from what experience, with what sources.",
						"Being linked to by relevant sites because the content is worth citing.",
						"A page Google can crawl, index and render without obstacles.",
					]}
					bad={[
						"The meta keywords tag — Google does not use it.",
						"A target word count — there is no minimum or maximum.",
						"Keywords in the domain or URL — they have hardly any effect.",
						"The number or order of headings — it does not matter to ranking.",
						'A "duplicate content penalty" — duplicates are inefficient, not penalised (copying others is different).',
						"E-E-A-T as a ranking factor — it is not one; it describes what the systems look for.",
					]}
				/>
				<Text size="sm" c="dimmed">
					Changes take time: some show in hours, others take months. Wait a few weeks
					before judging whether a change worked.
				</Text>
			</GuideSection>

			<SemanticsSection />

			<GuideSection
				section={S.onPage}
				sources={[
					SRC.titleLinks,
					SRC.snippets,
					SRC.mdnHeadings,
					SRC.crawlableLinks,
					SRC.canonical,
					SRC.structuredDataIntro,
					SRC.images,
					SRC.urlStructure,
				]}
			>
				<Text>
					On-page SEO is everything on the page itself that tells searchers and Google
					what it is about. The check reference below has a chapter for each row.
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={8} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={140}>Element</Table.Th>
							<Table.Th>What it does</Table.Th>
							<Table.Th>Good</Table.Th>
							<Table.Th>Bad</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{ON_PAGE.map((row) => (
							<Table.Tr key={row.element}>
								<Table.Td fw={600}>{row.element}</Table.Td>
								<Table.Td>{row.does}</Table.Td>
								<Table.Td c="teal.8">{row.good}</Table.Td>
								<Table.Td c="red.8">{row.bad}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</GuideSection>

			<OnPageInDepth />

			<LinkingSection />

			<SignalsInDepth />

			<GuideSection
				section={S.technical}
				sources={[
					SRC.robotsIntro,
					SRC.blockIndexing,
					SRC.sitemaps,
					SRC.redirects,
					SRC.httpStatusCodes,
					SRC.mobileFirst,
					SRC.javascriptSeo,
					SRC.httpsSignal,
				]}
			>
				<Text fw={600}>robots.txt is not noindex</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th />
							<Table.Th>robots.txt Disallow</Table.Th>
							<Table.Th>noindex (meta tag or X-Robots-Tag)</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						<Table.Tr>
							<Table.Td fw={600}>Controls</Table.Td>
							<Table.Td>Crawling: whether a bot may fetch the URL.</Table.Td>
							<Table.Td>Indexing: whether the page may appear in results.</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td fw={600}>The URL can still appear?</Table.Td>
							<Table.Td>
								Yes — without a description, known from links to it.
							</Table.Td>
							<Table.Td>No, once Google has recrawled the page.</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td fw={600}>Use it for</Table.Td>
							<Table.Td>
								Keeping bots out of areas that waste crawling (search results,
								carts).
							</Table.Td>
							<Table.Td>Keeping a page out of search.</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
				<Text size="sm">
					Never combine them on one page: if robots.txt blocks the URL, Google never sees
					the noindex. And Google ignores <Code>noindex:</Code> lines inside robots.txt.
				</Text>

				<Text fw={600}>Sitemaps</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						List only the canonical, indexable URLs you want in search — absolute URLs.
					</List.Item>
					<List.Item>
						At most 50,000 URLs or 50 MB uncompressed per file; split larger ones with
						an index.
					</List.Item>
					<List.Item>
						<Code>lastmod</Code> is used only if it is accurate — the date of the last
						significant change. Google ignores <Code>priority</Code> and{" "}
						<Code>changefreq</Code>.
					</List.Item>
					<List.Item>
						Reference it in robots.txt and submit it in Search Console.
					</List.Item>
				</List>

				<Text fw={600}>Redirects</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Permanent (301, 308)</b> when a page has moved for good — Google shows
						the new URL. <b>Temporary (302, 307)</b> only for short-term moves — Google
						keeps the old one.
					</List.Item>
					<List.Item>
						Prefer server-side redirects. An instant meta refresh is read as permanent,
						a delayed one as temporary; JavaScript redirects only when nothing else is
						possible, since rendering can fail.
					</List.Item>
					<List.Item>
						Send every old address straight to the final one: each hop is another
						request, and Googlebot follows only up to 10.
					</List.Item>
				</List>

				<Text fw={600}>Status codes</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						{STATUS_CODES.map((row) => (
							<Table.Tr key={row.code}>
								<Table.Td w={110} fw={600}>
									{row.code}
								</Table.Td>
								<Table.Td>{row.google}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>

				<Text fw={600}>Also part of technical SEO</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>HTTPS</b> everywhere, with plain HTTP redirected permanently — a
						lightweight ranking signal, a strong trust signal.
					</List.Item>
					<List.Item>
						<b>Mobile-first indexing</b>: Google indexes the page its smartphone crawler
						sees, so the mobile version must have the same content, links and markup.
					</List.Item>
					<List.Item>
						<b>JavaScript</b>: Google renders it, later and not always; AI assistants'
						crawlers do not run it at all. Text that matters belongs in the HTML.
					</List.Item>
					<List.Item>
						<b>One address per page</b>: one host (www or not), one scheme (https),
						redirects from the rest, and a canonical.
					</List.Item>
				</List>
			</GuideSection>

			<RobotsTxtInDepth />

			<MetaRobotsSection />
		</GuidePart>
	);
}
