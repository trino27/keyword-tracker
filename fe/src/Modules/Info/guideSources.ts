import { ISSUE_SOURCES, type ISeoIssueSource } from "@app/contracts";

/**
 * The pages the guide's own chapters cite, beyond the checks' sources. Each was opened
 * and read against the sentence it backs on 2026-10-11. First-party wherever one exists;
 * Ahrefs only for search intent, which no search engine documents under that name.
 */
export const GUIDE_SOURCES = {
	...ISSUE_SOURCES,
	howSearchWorks: {
		title: "Google Search Central: In-depth guide to how Google Search works",
		url: "https://developers.google.com/search/docs/fundamentals/how-search-works",
	},
	rankingSystems: {
		title: "Google Search Central: A guide to Google Search ranking systems",
		url: "https://developers.google.com/search/docs/appearance/ranking-systems-guide",
	},
	searchEssentials: {
		title: "Google Search Essentials",
		url: "https://developers.google.com/search/docs/essentials",
	},
	httpStatusCodes: {
		title: "Google: How HTTP status codes, and network and DNS errors affect Google Search",
		url: "https://developers.google.com/crawling/docs/troubleshooting/http-status-codes",
	},
	webVitals: {
		title: "web.dev: Web Vitals",
		url: "https://web.dev/articles/vitals",
	},
	optimizeInp: {
		title: "web.dev: Optimize Interaction to Next Paint",
		url: "https://web.dev/articles/optimize-inp",
	},
	optimizeCls: {
		title: "web.dev: Optimize Cumulative Layout Shift",
		url: "https://web.dev/articles/optimize-cls",
	},
	ttfb: {
		title: "web.dev: Time to First Byte (TTFB)",
		url: "https://web.dev/articles/ttfb",
	},
	searchConsole: {
		title: "Google Search Central: Get started with Search Console",
		url: "https://developers.google.com/search/docs/monitor-debug/search-console-start",
	},
	performanceReport: {
		title: "Search Console Help: Performance report (Search results)",
		url: "https://support.google.com/webmasters/answer/7576553",
	},
	localRanking: {
		title: "Google Business Profile Help: Tips to improve your local ranking on Google",
		url: "https://support.google.com/business/answer/7091",
	},
	siteMove: {
		title: "Google Search Central: Site moves with URL changes",
		url: "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes",
	},
	coreUpdates: {
		title: "Google Search Central: Google Search's core updates and your website",
		url: "https://developers.google.com/search/updates/core-updates",
	},
	manualActions: {
		title: "Search Console Help: Manual actions report",
		url: "https://support.google.com/webmasters/answer/9044175",
	},
	keywordClustering: {
		title: "Ahrefs: How to do keyword clustering",
		url: "https://ahrefs.com/blog/keyword-clustering/",
	},
	mdnSemantics: {
		title: "MDN: Semantics (glossary)",
		url: "https://developer.mozilla.org/en-US/docs/Glossary/Semantics",
	},
	searchIntent: {
		title: "Ahrefs: Search intent in SEO",
		url: "https://ahrefs.com/blog/search-intent/",
	},
} as const satisfies Record<string, ISeoIssueSource>;
