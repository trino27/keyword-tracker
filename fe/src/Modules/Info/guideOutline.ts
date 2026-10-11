/**
 * The guide's chapters, in reading order: the side navigation lists them and each section
 * takes its id from here, so a link and its target cannot drift apart. The check
 * reference is not listed here — its chapters come from the catalogue — and sits between
 * Core Web Vitals and Beyond this tracker.
 */
export const GUIDE_SECTIONS = {
	howItWorks: { id: "how-it-works", label: "How the tracker works" },
	screens: { id: "screens", label: "Reading the screens" },
	outcomes: { id: "check-outcomes", label: "Check outcomes" },
	severity: { id: "severity", label: "Severity levels" },
	score: { id: "score", label: "The SEO score" },
	keywords: { id: "keywords", label: "Keywords" },
	positions: { id: "positions", label: "Positions" },
	howSearchWorks: { id: "how-search-works", label: "Crawling and indexing" },
	rendering: { id: "rendering", label: "Rendering and JavaScript" },
	crawlBudget: { id: "crawl-budget", label: "Crawl budget" },
	indexStatus: { id: "index-status", label: "Getting indexed: statuses" },
	ranking: { id: "ranking", label: "What makes a page rank" },
	semantics: { id: "semantics", label: "Semantics and topics" },
	onPage: { id: "on-page", label: "On-page basics" },
	titles: { id: "titles-guide", label: "Titles and title links" },
	descriptions: { id: "descriptions-guide", label: "Meta descriptions and snippets" },
	headingsGuide: { id: "headings-guide", label: "Headings: the page outline" },
	linking: { id: "linking", label: "Internal and external links" },
	canonicals: { id: "canonicals-guide", label: "Canonicals: choosing the URL" },
	structuredData: { id: "structured-data-guide", label: "Structured data and rich results" },
	technical: { id: "technical", label: "Technical SEO" },
	robotsTxt: { id: "robots-txt", label: "robots.txt in detail" },
	metaRobots: { id: "meta-robots", label: "Meta robots" },
	cwv: { id: "cwv", label: "What Core Web Vitals are" },
	lcp: { id: "lcp", label: "LCP — loading" },
	inp: { id: "inp", label: "INP — responsiveness" },
	cls: { id: "cls", label: "CLS — visual stability" },
	speedHere: { id: "speed-measurement", label: "How speed is measured here" },
	lighthouseOverview: { id: "lighthouse-overview", label: "Lighthouse and our crawl" },
	keywordResearch: { id: "keyword-research", label: "Keyword research and intent" },
	links: { id: "backlinks", label: "Backlinks and authority" },
	eeat: { id: "eeat", label: "E-E-A-T and trust" },
	searchConsole: { id: "search-console", label: "Real data: Search Console" },
	local: { id: "local-seo", label: "Local SEO" },
	migrations: { id: "migrations", label: "Site moves" },
	updates: { id: "updates-penalties", label: "Core updates and penalties" },
	aiSearch: { id: "ai-search", label: "AI search" },
} as const satisfies Record<string, { id: string; label: string }>;

type TSection = (typeof GUIDE_SECTIONS)[keyof typeof GUIDE_SECTIONS];

const S = GUIDE_SECTIONS;

export const GUIDE_PARTS_BEFORE_CHECKS: { title: string; sections: TSection[] }[] = [
	{ title: "Using this tracker", sections: [S.howItWorks, S.screens] },
	{
		title: "How pages are judged",
		sections: [S.outcomes, S.severity, S.score, S.keywords, S.positions],
	},
	{
		title: "SEO fundamentals",
		sections: [
			S.howSearchWorks,
			S.rendering,
			S.crawlBudget,
			S.indexStatus,
			S.ranking,
			S.semantics,
			S.onPage,
			S.titles,
			S.descriptions,
			S.headingsGuide,
			S.linking,
			S.canonicals,
			S.structuredData,
			S.technical,
			S.robotsTxt,
			S.metaRobots,
		],
	},
	{ title: "Core Web Vitals", sections: [S.cwv, S.lcp, S.inp, S.cls, S.speedHere] },
];

export const GUIDE_PARTS_AFTER_CHECKS: { title: string; sections: TSection[] }[] = [
	{
		title: "Beyond this tracker",
		sections: [
			S.keywordResearch,
			S.links,
			S.eeat,
			S.searchConsole,
			S.local,
			S.migrations,
			S.updates,
			S.aiSearch,
		],
	},
];

export const CHECK_REFERENCE_TITLE = "Check reference";
export const LIGHTHOUSE_TITLE = "Lighthouse audits";

/** Where a chapter of the check reference, and one check in it, can be linked to. */
export const topicAnchor = (topicId: string) => `checks-${topicId}`;
export const checkAnchor = (code: string) => `check-${code}`;

/** Marks the headings the side navigation follows while the reader scrolls. */
export const ANCHOR_ATTRIBUTE = "data-guide-anchor";
