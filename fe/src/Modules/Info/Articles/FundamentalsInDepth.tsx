import { Code, List, Table, Text } from "@mantine/core";
import { DoAvoid } from "../DoAvoid/DoAvoid";
import { GuideSection } from "../GuideSection/GuideSection";
import { GUIDE_SECTIONS as S } from "../guideOutline";
import { GUIDE_SOURCES as SRC } from "../guideSources";

/** Which of the tracker's checks look at a subject, so each chapter ends on what to open next. */
function CheckedHere({ checks }: { checks: string }) {
	return (
		<Text size="sm" c="dimmed">
			<b>Checked here by:</b> {checks}
		</Text>
	);
}

const INDEX_STATUSES = [
	{
		status: "Discovered – currently not indexed",
		means: "Google knows the URL but has not crawled it yet, usually postponed to spare the server.",
		act: "Usually wait. Make sure the page is linked from other pages and listed in the sitemap.",
	},
	{
		status: "Crawled – currently not indexed",
		means: "Google fetched the page and decided not to index it, for now.",
		act: "Usually a quality or uniqueness question: improve the page if it matters.",
	},
	{
		status: "Duplicate without user-selected canonical",
		means: "Google sees a copy of another page and chose that one; you declared no canonical.",
		act: "Fine for real duplicates. Add a canonical if Google picked the wrong one.",
	},
	{
		status: "Duplicate, Google chose different canonical than user",
		means: "Your canonical and Google's choice disagree.",
		act: "Investigate: fix the canonical, or make the pages genuinely different.",
	},
	{
		status: "Alternate page with proper canonical tag",
		means: "An alternate version correctly points to the indexed one.",
		act: "Nothing to do.",
	},
	{
		status: "Excluded by noindex",
		means: "The page says noindex.",
		act: "Remove it if the page should be in search.",
	},
	{
		status: "Blocked by robots.txt",
		means: "Google may not crawl the page.",
		act: "Intended? Note it does not reliably keep a page out of the index — noindex does.",
	},
	{
		status: "Not found (404) / Page with redirect",
		means: "The page is gone, or moved.",
		act: "Expected when intended. Redirect a moved page with a 301.",
	},
	{
		status: "Soft 404",
		means: "A “not found” page answered as a success.",
		act: "Fix: answer a real 404, or give the page real content.",
	},
	{
		status: "Server error (5xx) / Blocked (403)",
		means: "Googlebot got an error or was refused.",
		act: "Fix: server health, or let Googlebot in.",
	},
] as const;

/** Rendering, crawl budget and indexing statuses: what happens between "found" and "in results". */
export function CrawlIndexInDepth() {
	return (
		<>
			<GuideSection section={S.rendering} sources={[SRC.javascriptSeo, SRC.howSearchWorks]}>
				<Text>
					Google processes a page in three phases: <b>crawling</b> (fetching it, after
					checking robots.txt), <b>rendering</b> (running its JavaScript in a headless
					Chromium) and <b>indexing</b> (storing what the rendered page says). Every page
					that answers 200 is queued for rendering; it may wait seconds, sometimes longer.
					Links found in the rendered page are queued for crawling in turn.
				</Text>
				<List size="sm" spacing={4}>
					<List.Item>
						Content that only appears after JavaScript runs is seen later, and only if
						rendering works. Server-side rendering or pre-rendering puts it in the HTML
						for every crawler — most AI assistants' crawlers do not run JavaScript at
						all.
					</List.Item>
					<List.Item>
						Single-page apps must navigate with real URLs (the History API), not
						fragments such as <Code>#/pricing</Code>: Google cannot reliably resolve
						fragment routes.
					</List.Item>
					<List.Item>
						A <Code>noindex</Code> in the original HTML may stop Google from rendering
						at all, so removing it with JavaScript may not work. Put the right rule in
						the HTML.
					</List.Item>
					<List.Item>
						An app that shows “not found” with a 200 creates soft 404s: redirect to a
						URL that answers 404, or add noindex to the error view.
					</List.Item>
				</List>
				<CheckedHere checks="Posts need JavaScript to show their text (site), Links Google cannot follow, Lighthouse audits (which see the rendered page)." />
			</GuideSection>

			<GuideSection section={S.crawlBudget} sources={[SRC.crawlBudget]}>
				<Text>
					Crawl budget is how many URLs Google can and wants to crawl on a site: the{" "}
					<b>crawl capacity</b> the server can take without slowing down (it drops when
					answers get slow or return 5xx or 429), and the <b>crawl demand</b> — how many
					URLs there are, how popular and how stale they are. It matters mainly for very
					large sites (about a million pages changing weekly) or sites with tens of
					thousands of pages changing daily. A blog that gets new posts crawled the same
					day does not need to think about it.
				</Text>
				<DoAvoid
					good={[
						"Consolidate duplicates; one URL per piece of content.",
						"Answer 404 or 410 for pages that are gone.",
						"Keep sitemaps current, with accurate lastmod.",
						"Keep the server fast; support 304 Not Modified.",
					]}
					bad={[
						"Soft 404s, which keep being crawled.",
						"Long redirect chains.",
						"noindex to save crawling — Google still has to fetch the page to see it; robots.txt is the tool for that.",
						"Endless URL variants from filters, sessions and parameters.",
					]}
				/>
				<CheckedHere checks="Missing pages answer 200 (soft 404), Host redirects form a chain, Sitemap lastmod dates look generated, Internal links to non-canonical URLs, Links to this site redirect." />
			</GuideSection>

			<GuideSection
				section={S.indexStatus}
				sources={[SRC.pageIndexing, SRC.searchConsole, SRC.howSearchWorks]}
			>
				<Text>
					To get a new or updated page found: link to it from other pages, list it in the
					sitemap, and in Search Console's URL Inspection, test the live URL and request
					indexing. None of these guarantees indexing — Google decides. Search Console's{" "}
					<b>Page indexing</b> report says why a page is not indexed:
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={230}>Status</Table.Th>
							<Table.Th>Means</Table.Th>
							<Table.Th>What to do</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{INDEX_STATUSES.map((row) => (
							<Table.Tr key={row.status}>
								<Table.Td fw={600}>{row.status}</Table.Td>
								<Table.Td>{row.means}</Table.Td>
								<Table.Td>{row.act}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Text size="sm" c="dimmed">
					The tracker cannot see Google's index; it finds the causes on the page —
					noindex, robots.txt, canonicals, duplicates, soft 404s — that these statuses
					report after the fact.
				</Text>
			</GuideSection>
		</>
	);
}

const TITLE_REWRITES = [
	["Half-empty", "Part of the title is missing, e.g. only the site name."],
	["Obsolete", "The title names a different year than the page shows."],
	["Inaccurate", "The title does not match what the page is about."],
	[
		"Micro-boilerplate",
		"Many pages share nearly the same title; Google adds what tells them apart.",
	],
	["No clear main title", "Several headings look equally important."],
	["Language or script mismatch", "The title is in another language or alphabet than the page."],
] as const;

/** Titles, descriptions and headings — the parts of a page a searcher reads first. */
export function OnPageInDepth() {
	return (
		<>
			<GuideSection section={S.titles} sources={[SRC.titleLinks, SRC.starterGuide]}>
				<Text>
					The headline of a search result is the <b>title link</b>. Google writes it
					mainly from the <Code>&lt;title&gt;</Code>, but also reads the page's main
					visible title, its <Code>&lt;h1&gt;</Code>, og:title, prominent text, anchor
					text of links to the page and WebSite structured data — and rewrites the title
					when it serves searchers badly:
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Tbody>
						{TITLE_REWRITES.map(([reason, means]) => (
							<Table.Tr key={reason}>
								<Table.Td w={200} fw={600}>
									{reason}
								</Table.Td>
								<Table.Td>{means}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Code block>
					{`Good: <title>Local SEO checklist: 12 steps to the map pack | Example</title>
Bad:  <title>Home</title>
Bad:  <title>SEO, SEO tips, SEO checklist, best SEO, SEO 2026</title>`}
				</Code>
				<DoAvoid
					good={[
						"A unique title on every page, naming what it offers.",
						"The subject first, the brand short at the end after a separator.",
						"The same language and alphabet as the page.",
						"A clear main heading that agrees with the title.",
					]}
					bad={[
						"The same or nearly the same title on many pages.",
						"Repeating keywords.",
						"A year in the title the page no longer lives up to.",
						"Titles that over-promise what the page delivers.",
					]}
				/>
				<CheckedHere checks="Title is missing, Title length, Title is in another script, Title names a past year, Title is used by another page; Lighthouse: Title is missing or empty." />
			</GuideSection>

			<GuideSection section={S.descriptions} sources={[SRC.snippets]}>
				<Text>
					The text under the headline is the <b>snippet</b>. Google builds it mostly from
					the page itself, choosing the passage that best matches each search — so one
					page can show different snippets for different queries. It uses the{" "}
					<Code>meta description</Code> when that describes the page better. The
					description is not a ranking factor and has no fixed length; Google cuts
					snippets to fit the screen.
				</Text>
				<Code block>
					{`<meta name="description" content="Twelve steps to rank in Google's local map pack — from your Business Profile to reviews, with a printable checklist.">`}
				</Code>
				<DoAvoid
					good={[
						"A unique summary per page that makes the click worthwhile.",
						"Concrete facts: what is inside, for whom, by whom, when.",
						"For large sites, descriptions generated from the page's data — readable, not templated.",
					]}
					bad={[
						"The same description on every page.",
						"A list of keywords.",
						"Repeating the title.",
					]}
				/>
				<Text size="sm">
					To limit snippets: <Code>nosnippet</Code>, <Code>max-snippet</Code>, or{" "}
					<Code>data-nosnippet</Code> on a passage (see Meta robots).
				</Text>
				<CheckedHere checks="Meta description is missing, Meta description length, Description repeats the title, Meta description is used by another page, Search snippet is restricted; Lighthouse: Meta description is missing or empty." />
			</GuideSection>

			<GuideSection
				section={S.headingsGuide}
				sources={[SRC.mdnHeadings, SRC.starterGuide, SRC.titleLinks]}
			>
				<Text>
					Headings are the page's outline. <Code>&lt;h1&gt;</Code> names the page — one
					per page, as MDN advises; <Code>&lt;h2&gt;</Code> names its sections,{" "}
					<Code>&lt;h3&gt;</Code> their subsections. Screen reader users jump from heading
					to heading, readers skim them, and Google reads them to understand each part
					and, together with the title, to build the title link.
				</Text>
				<Code block>
					{`<h1>Local SEO checklist</h1>
  <h2>1. Claim your Business Profile</h2>
    <h3>Choosing the right category</h3>
  <h2>2. Collect reviews</h2>`}
				</Code>
				<Text size="sm">
					Google says the number and order of headings do not affect ranking — skipping a
					level is an accessibility problem, not a ranking one. What matters to search is
					that headings say what each section is about.
				</Text>
				<DoAvoid
					good={[
						"One H1 that states the subject.",
						"H2s that would make sense as a table of contents.",
						"Headings in order, one level at a time.",
					]}
					bad={[
						"A title styled as a <div> instead of an <h1>.",
						"Headings chosen for their font size.",
						"A long text with no subheadings at all.",
					]}
				/>
				<CheckedHere checks="H1 is missing, More than one H1, Heading level skipped, No subheadings; Lighthouse: Heading levels out of sequence." />
			</GuideSection>
		</>
	);
}

const CANONICAL_METHODS = [
	[
		"Permanent redirect (301/308)",
		"Strong",
		"When the duplicate should no longer be reachable at all.",
	],
	[
		'rel="canonical" (link or HTTP header)',
		"Strong",
		"When both URLs must keep working — tracking parameters, print versions, syndicated copies. The header form works for PDFs.",
	],
	[
		"Listing the URL in the sitemap",
		"Weak",
		"Always, alongside the others: list only canonical URLs.",
	],
] as const;

/** Canonicals and structured data — the two places a page states facts about itself. */
export function SignalsInDepth() {
	return (
		<>
			<GuideSection
				section={S.canonicals}
				sources={[SRC.canonical, SRC.canonicalRfc, SRC.redirects]}
			>
				<Text>
					When the same content is reachable at several URLs — with and without a slash,
					http and https, with tracking parameters — Google groups them and picks one to
					show: the <b>canonical</b>. You can tell it which one, by signals of different
					strength, and they work best combined:
				</Text>
				<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Method</Table.Th>
							<Table.Th w={80}>Signal</Table.Th>
							<Table.Th>Use it</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{CANONICAL_METHODS.map(([method, strength, use]) => (
							<Table.Tr key={method}>
								<Table.Td fw={600}>{method}</Table.Td>
								<Table.Td>{strength}</Table.Td>
								<Table.Td>{use}</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
				<Text size="sm">
					Google also weighs its own signals — it prefers HTTPS over HTTP, and pages in a
					consistent hreflang set — so a canonical is a strong hint, not an order. With no
					signal at all, Google picks the version it thinks is best.
				</Text>
				<Code block>
					{`<!-- on https://example.com/blog/local-seo/?utm_source=newsletter -->
<link rel="canonical" href="https://example.com/blog/local-seo/">`}
				</Code>
				<DoAvoid
					good={[
						"An absolute https URL, in <head>, on every page — self-referencing on originals.",
						"The same canonical in the tag, the sitemap and internal links.",
					]}
					bad={[
						"robots.txt to pick a canonical — a blocked URL can still be indexed.",
						"noindex to pick a canonical — it removes the page from search altogether.",
						"Two different canonicals, a relative path, or a URL fragment.",
						"A canonical to a page that redirects or is noindex.",
					]}
				/>
				<CheckedHere checks="Canonical URL is missing, Canonical points elsewhere, Canonical points to HTTP, Conflicting canonical URLs, Canonical URL is relative, Canonical points to a broken page, Points at a development host; Lighthouse: Canonical URL is invalid or misdirected." />
			</GuideSection>

			<GuideSection
				section={S.structuredData}
				sources={[
					SRC.structuredDataIntro,
					SRC.structuredDataPolicies,
					SRC.articleMarkup,
					SRC.breadcrumbMarkup,
				]}
			>
				<Text>
					Structured data states facts about a page in a form machines read without
					guessing — this is an article, by this author, published on this date, with this
					image, in this part of the site. Google supports JSON-LD, Microdata and RDFa,
					and recommends <b>JSON-LD</b>. It makes a page eligible for <b>rich results</b>{" "}
					(a date, an image, a breadcrumb trail in place of the URL), but does not
					guarantee them.
				</Text>
				<Code block>
					{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Local SEO checklist",
  "image": "https://example.com/img/local-seo-1200.jpg",
  "datePublished": "2026-03-02T09:00:00+01:00",
  "dateModified": "2026-09-28T14:30:00+01:00",
  "author": { "@type": "Person", "name": "Jane Doe", "url": "https://example.com/authors/jane" }
}
</script>`}
				</Code>
				<List size="sm" spacing={4}>
					<List.Item>
						<b>Required</b> properties must all be present for a feature to be possible;{" "}
						<b>recommended</b> ones make it more likely. Complete, accurate markup beats
						lots of it.
					</List.Item>
					<List.Item>
						Mark up only what visitors can see on the page; markup that misleads can be
						ignored or count as spam.
					</List.Item>
					<List.Item>
						Test with the Rich Results Test before release, and watch Search Console's
						rich result reports after — a template change can break markup on every page
						at once.
					</List.Item>
				</List>
				<CheckedHere checks="Structured data that cannot be read, No article structured data, Article markup is missing recommended fields, Author markup is incomplete, Article dates are not in the format Google asks for, Article headline does not match the page, Dates contradict each other, No breadcrumb markup, Breadcrumb markup is missing required fields, No site name declared (site)." />
			</GuideSection>
		</>
	);
}

const ROBOTS_STATUS = [
	["2xx", "The file is read as served."],
	["3xx", "Redirects are followed (at least five hops), then treated as 404."],
	["4xx (except 429)", "As if there were no robots.txt: everything may be crawled."],
	[
		"5xx, 429, network error",
		"Crawling stops for about 12 hours; for up to 30 days Google uses the last good copy; after that, if the site is otherwise up, it acts as if there were no file.",
	],
] as const;

/** robots.txt as Google reads it: where it applies, how groups and rules are chosen, what errors mean. */
export function RobotsTxtInDepth() {
	return (
		<GuideSection
			section={S.robotsTxt}
			sources={[SRC.robotsSpec, SRC.robotsIntro, SRC.robotsRfc]}
		>
			<Code block>
				{`User-agent: *
Disallow: /cart/
Disallow: /search
Allow: /search/help
Disallow: /*?sessionid=

User-agent: Googlebot
Disallow: /cart/
Disallow: /beta/

Sitemap: https://example.com/sitemap.xml`}
			</Code>
			<List size="sm" spacing={4}>
				<List.Item>
					<b>Where:</b> at the root, <Code>/robots.txt</Code>, and only for that exact
					host, scheme and port — <Code>blog.example.com</Code> and <Code>http://</Code>{" "}
					need their own. Up to 500 KiB is read; UTF-8 plain text. Google caches it for up
					to 24 hours.
				</List.Item>
				<List.Item>
					<b>Which group:</b> a crawler obeys exactly one group — the most specific one
					naming it (case does not matter), else <Code>*</Code>. Groups are not combined
					with <Code>*</Code>: in the example, Googlebot ignores everything under{" "}
					<Code>*</Code>, which is why its group repeats <Code>/cart/</Code>.
				</List.Item>
				<List.Item>
					<b>Which rule:</b> the longest matching path wins; on a tie, Allow wins. Paths
					are case-sensitive and start with <Code>/</Code>. <Code>*</Code> matches
					anything, <Code>$</Code> anchors the end: <Code>Disallow: /*.pdf$</Code>.
				</List.Item>
				<List.Item>
					<b>Supported fields:</b> user-agent, allow, disallow, sitemap. Google ignores
					crawl-delay, noindex, host and anything else.
				</List.Item>
				<List.Item>
					<b>What it does not do:</b> keep a page out of the index — a blocked URL can
					still appear, known from links, without a description. Use noindex (and keep the
					page crawlable) for that.
				</List.Item>
			</List>
			<Text fw={600}>When robots.txt answers with an error</Text>
			<Table withTableBorder withColumnBorders verticalSpacing={6} fz="sm">
				<Table.Tbody>
					{ROBOTS_STATUS.map(([status, means]) => (
						<Table.Tr key={status}>
							<Table.Td w={190} fw={600}>
								{status}
							</Table.Td>
							<Table.Td>{means}</Table.Td>
						</Table.Tr>
					))}
				</Table.Tbody>
			</Table>
			<CheckedHere checks="robots.txt blocks Googlebot, robots.txt blocks scripts or styles, robots.txt blocks AI search crawlers, robots.txt is past 500 KiB, robots.txt rules Google does not support, Googlebot's group drops the general rules; Lighthouse: robots.txt is invalid or unreachable. A robots.txt answering a server error stops this tracker's crawl, as it stops Google's." />
		</GuideSection>
	);
}
