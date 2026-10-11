import { CRAWL_CANDIDATE_LIMIT, CWV_THRESHOLDS } from "@app/contracts";
import { type TGuideCode } from "@Core/Constants/checkTopics";
import { seconds, type ICheckCriteria } from "../criteriaShape";

const { lcp, inp, cls } = CWV_THRESHOLDS;

/** How every Core Web Vitals finding is measured: one PageSpeed Insights call per page. */
const CWV_SOURCE =
	"After each crawl the page joins a queue and is measured with Google PageSpeed Insights, mobile strategy, at most once every 24 hours. For each metric the tracker keeps the best evidence Google returns: real Chrome visitors to this page over 28 days, else real visitors to the whole site, else one Lighthouse lab run.";

const CWV_BAND =
	"The value is put in Google's band at the published thresholds, both inclusive; a metric outside the good band produces exactly one finding — Needs improvement or Poor, never both — and the badge colour uses the same rule, so they cannot disagree. Speed findings never change the SEO score.";

const PSI_STEP =
	"Open PageSpeed Insights (https://pagespeed.web.dev), enter the page URL and choose Mobile.";
const FIELD_STEP =
	'Read the "Discover what your real users are experiencing" section first (this URL, or Origin when the URL has too little data); the lab Diagnose section below is one simulated run.';
const CONSOLE_STEP =
	"In Search Console, the Core Web Vitals report groups the site's URLs by the same bands from real-visitor data.";

/** Core Web Vitals findings, and the checks of the site as a whole: robots.txt, sitemap, host. */
export const SPEED_AND_SITE_CRITERIA = {
	// ── Core Web Vitals findings ─────────────────────────────────────────────────────
	CWV_LCP_NEEDS_IMPROVEMENT: {
		passes: `LCP is ${seconds(lcp.good)} or less (good), or above ${seconds(lcp.poor)} (then the Poor finding replaces this one).`,
		fails: `LCP is above ${seconds(lcp.good)} and at most ${seconds(lcp.poor)}.`,
		ifPasses:
			"Most visitors see the main content within 2.5 seconds, before they give up. Good Core Web Vitals align with what Google's ranking systems reward, though relevance always comes first.",
		example: {
			good: '<img src="/img/hero-1200.webp" width="1200" height="675"\n     fetchpriority="high" alt="…">',
			bad: '<img src="/img/hero-4000.jpg" loading="lazy" alt="…">\n<!-- 3 MB image, requested only after layout -->',
			lang: "html",
		},
		howChecked: `${CWV_SOURCE} ${CWV_BAND}`,
		manualCheck: [
			PSI_STEP,
			FIELD_STEP,
			"Under Diagnose, open “Largest Contentful Paint element” to see which element it is.",
			CONSOLE_STEP,
		],
	},
	CWV_LCP_POOR: {
		passes: `LCP is ${seconds(lcp.poor)} or less.`,
		fails: `LCP is above ${seconds(lcp.poor)}.`,
		ifPasses:
			"At least three visits in four see the page's main content within 4 seconds — out of the band where Google says a page is poor.",
		example: {
			good: '<link rel="preload" as="image" href="/img/hero-1200.webp" fetchpriority="high">\n<script src="/js/app.js" defer></script>',
			bad: '<script src="https://third-party.example/widget.js"></script>\n<div style="background-image:url(/img/hero-4000.jpg)"></div>',
			lang: "html",
		},
		howChecked: `${CWV_SOURCE} ${CWV_BAND}`,
		manualCheck: [
			PSI_STEP,
			FIELD_STEP,
			"Under Diagnose, read the LCP breakdown (time to first byte, load delay, load time, render delay) to see where the time goes.",
		],
	},
	CWV_INP_NEEDS_IMPROVEMENT: {
		passes: `INP is ${inp.good} ms or less (good), or above ${inp.poor} ms (then the Poor finding replaces this one).`,
		fails: `INP is above ${inp.good} ms and at most ${inp.poor} ms.`,
		ifPasses:
			"Taps, clicks and key presses get a visible response within 200 ms, so the page feels immediate.",
		example: {
			good: "button.addEventListener('click', () => {\n  showSpinner();               // paint the response first\n  setTimeout(() => sendReport()); // then do the heavy work\n});",
			bad: "button.addEventListener('click', () => {\n  sendReport(); // 400 ms of work before anything is painted\n  showSpinner();\n});",
			lang: "text",
		},
		howChecked: `${CWV_SOURCE} INP is only taken from real visitors: a lab run never interacts with the page, so when Google has no field data for the page or the site there is no INP value and no finding. ${CWV_BAND}`,
		manualCheck: [
			PSI_STEP,
			FIELD_STEP,
			"In Chrome DevTools → Performance, record while clicking around the page and look for long tasks after each interaction.",
		],
	},
	CWV_INP_POOR: {
		passes: `INP is ${inp.poor} ms or less.`,
		fails: `INP is above ${inp.poor} ms.`,
		ifPasses: "Visitors who tap do not wait more than half a second for anything to happen.",
		example: {
			good: '<script src="https://chat.example/widget.js" defer></script>\n<!-- third-party scripts loaded late, after the content -->',
			bad: '<script src="https://chat.example/widget.js"></script>\n<script src="https://ads.example/tag.js"></script>\n<!-- heavy scripts competing for the main thread while readers tap -->',
			lang: "html",
		},
		howChecked: `${CWV_SOURCE} INP is only taken from real visitors, never from the lab run. ${CWV_BAND}`,
		manualCheck: [
			PSI_STEP,
			FIELD_STEP,
			"In Chrome DevTools → Performance, record an interaction and look for long tasks (red corners) on the main thread.",
		],
	},
	CWV_CLS_NEEDS_IMPROVEMENT: {
		passes: `CLS is ${cls.good} or less (good), or above ${cls.poor} (then the Poor finding replaces this one).`,
		fails: `CLS is above ${cls.good} and at most ${cls.poor}.`,
		ifPasses:
			"Content stays where readers expect it, so they do not lose their place or tap the wrong thing.",
		example: {
			good: '<img src="/img/chart.png" width="800" height="450" alt="…">\n<div class="ad-slot" style="min-height:250px"></div>',
			bad: '<img src="/img/chart.png" alt="…">  <!-- no dimensions -->\n<div class="ad-slot"></div>      <!-- grows when the ad arrives -->',
			lang: "html",
		},
		howChecked: `${CWV_SOURCE} A lab value only sees shifts during loading. ${CWV_BAND}`,
		manualCheck: [
			PSI_STEP,
			FIELD_STEP,
			"Under Diagnose, open “Avoid large layout shifts” to see which elements moved.",
			CONSOLE_STEP,
		],
	},
	CWV_CLS_POOR: {
		passes: `CLS is ${cls.poor} or less.`,
		fails: `CLS is above ${cls.poor}.`,
		ifPasses: "The page does not jump enough to make readers mis-tap or lose their place.",
		example: {
			good: "<style>\n  .banner { position: fixed; bottom: 0 } /* overlays, pushes nothing */\n</style>",
			bad: "<script>\n  document.body.prepend(cookieBanner); // pushes the article down after load\n</script>",
			lang: "html",
		},
		howChecked: `${CWV_SOURCE} ${CWV_BAND}`,
		manualCheck: [
			PSI_STEP,
			FIELD_STEP,
			"In Chrome DevTools → Performance, record a page load and look at the Layout shifts track.",
		],
	},

	// ── Site: robots.txt ─────────────────────────────────────────────────────────────
	ROBOTS_TXT_TRUNCATED: {
		passes: "robots.txt is at most 500 KiB.",
		fails: "robots.txt is larger than 500 KiB, so Google ignores everything after that point.",
		ifPasses: "Every rule in the file is one Google actually reads.",
		example: {
			good: "User-agent: *\nDisallow: /cart/\nDisallow: /search?\nDisallow: /*?sessionid=\n\nSitemap: https://example.com/sitemap.xml",
			bad: "User-agent: *\nDisallow: /product/1001/\nDisallow: /product/1002/\n… 40,000 more one-URL lines …",
			lang: "robots",
		},
		howChecked:
			"The crawl reads robots.txt the way Google does: only the first 500 KiB, dropping the line the limit cuts. The check fails when the file was cut. A site that did not answer robots.txt with 200 is not judged.",
		manualCheck: [
			"Open https://your-site/robots.txt in the browser, or run curl -sI https://your-site/robots.txt and read Content-Length.",
			"In Search Console, the robots.txt report shows the file Google fetched and any problems.",
		],
	},
	ROBOTS_TXT_UNSUPPORTED_RULES: {
		passes: "robots.txt uses only rules Google supports.",
		fails: "robots.txt contains noindex:, nofollow: or host: lines, which Google ignores.",
		ifPasses:
			"Nobody on the team believes a page is hidden, or a domain chosen, by a line Google does not act on.",
		example: {
			good: "User-agent: *\nDisallow: /cart/\n\nSitemap: https://example.com/sitemap.xml",
			bad: "User-agent: *\nNoindex: /drafts/\nHost: www.example.com",
			lang: "robots",
		},
		howChecked:
			"Every line of the robots.txt the crawl read is matched for a noindex:, nofollow: or host: field, case-insensitively, and each one found is quoted with its line number. A site that did not answer robots.txt with 200 is not judged.",
		manualCheck: [
			"Open https://your-site/robots.txt and search (Ctrl+F) for noindex, nofollow and host.",
			"Keep pages out of search with a robots meta tag instead, and choose the host with redirects.",
		],
	},
	ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES: {
		passes: "The Googlebot group repeats every path the general (*) group disallows.",
		fails: "The general group disallows paths the Googlebot group does not — and Google follows only its own group.",
		ifPasses: "Areas closed to every crawler are closed to Googlebot too.",
		example: {
			good: "User-agent: *\nDisallow: /admin/\n\nUser-agent: Googlebot\nDisallow: /admin/\nDisallow: /beta/",
			bad: "User-agent: *\nDisallow: /admin/\n\nUser-agent: Googlebot\nDisallow: /beta/\n# /admin/ is now open to Googlebot",
			lang: "robots",
		},
		howChecked:
			"The check splits robots.txt into groups the way RFC 9309 does. When there is both a group naming Googlebot and a general * group, it takes each non-empty Disallow of the general group, builds a sample path it covers, and asks the file whether Googlebot may fetch it while another bot may not. Each such path is reported. Without a Googlebot group, or without a general group, it is not judged.",
		manualCheck: [
			"Open https://your-site/robots.txt and find the User-agent: Googlebot group.",
			"Compare its Disallow lines with those under User-agent: *; every general rule Google should obey must be repeated in the Googlebot group.",
		],
	},

	// ── Site: sitemap ────────────────────────────────────────────────────────────────
	SITEMAP_LISTS_NON_INDEXABLE: {
		passes: "Every fetched sitemap entry answers 200, is indexable and names itself as canonical.",
		fails: "Some fetched entries redirect, answer an error, are noindex, or name another URL as canonical.",
		ifPasses:
			"The sitemap agrees with the pages it lists, so search engines keep trusting it to find new and changed URLs.",
		example: {
			good: "<url>\n  <loc>https://example.com/blog/local-seo/</loc>\n  <lastmod>2026-09-28</lastmod>\n</url>",
			bad: "<url><loc>https://example.com/blog/old-post/</loc></url>\n<!-- 301 → /blog/new-post/ -->",
			lang: "xml",
		},
		howChecked: `The sitemap entries this crawl fetched (up to ${CRAWL_CANDIDATE_LIMIT} considered per run) are judged: an entry fails when robots.txt disallows it, it is a soft 404, redirects (on or off the site), answers 4xx/5xx, is set to noindex, or names another URL as canonical. Entries the site refused to the crawler (401, 402, 403, 429, a bot challenge) are left out. It is a sample of the sitemap, not all of it.`,
		manualCheck: [
			"Open the sitemap in the browser and pick a few URLs.",
			"For each, run curl -sI -L https://… to see redirects and the final status; then check the page source for noindex and its canonical.",
			"In Search Console, the Sitemaps and Page indexing reports list submitted URLs that are not indexed and why.",
		],
	},
	SITEMAP_LISTS_OTHER_HOST_VARIANTS: {
		passes: "Sitemap URLs use the scheme and host the site serves its pages at.",
		fails: "Entries use http:// on an https site, or the other www variant.",
		ifPasses:
			"Each listed URL is the final address, with no redirect, and it agrees with the canonical the pages declare.",
		example: {
			good: "<!-- the site is served at https://www.example.com -->\n<url><loc>https://www.example.com/blog/local-seo/</loc></url>",
			bad: "<url><loc>http://example.com/blog/local-seo/</loc></url>",
			lang: "xml",
		},
		howChecked:
			"The check compares the origin (scheme and host) of every URL in the selected sitemap with the origin the crawled pages were actually served from. Any URL on another origin is reported. Without a selected sitemap or a crawled page, it is not judged.",
		manualCheck: [
			"Open the sitemap in the browser and search (Ctrl+F) for http:// and for the other www variant.",
			"Compare with the address the site shows in the browser bar after it loads.",
		],
	},
	SITEMAP_LASTMOD_UNRELIABLE: {
		passes: "lastmod dates vary and match when the pages say they last changed.",
		fails: "Every entry has the same date, dates are the sitemap's generation time, or they are older than the pages' own modified dates.",
		ifPasses:
			"Google can rely on lastmod to find updated posts sooner, since it uses the date only when it is consistently accurate.",
		example: {
			good: "<url><loc>https://example.com/a/</loc><lastmod>2026-03-02</lastmod></url>\n<url><loc>https://example.com/b/</loc><lastmod>2026-07-19</lastmod></url>",
			bad: "<url><loc>https://example.com/a/</loc><lastmod>2026-10-11T09:00:03Z</lastmod></url>\n<url><loc>https://example.com/b/</loc><lastmod>2026-10-11T09:00:03Z</lastmod></url>",
			lang: "xml",
		},
		howChecked:
			"At least 5 dated entries are needed. The sitemap fails if every lastmod is the same; if at least 80% of the timestamped dates fall within 2 hours of the crawl (generated, not real); or if at least 3 crawled pages, and at least half of those compared, declare a modification date more than a day newer than their lastmod.",
		manualCheck: [
			"Open the sitemap in the browser and read the <lastmod> values: are they all the same, or all today's?",
			"Open a few posts and compare their dateModified (Ctrl+U, search dateModified) with the sitemap's date.",
		],
	},

	// ── Site: host and server ────────────────────────────────────────────────────────
	HOST_VARIANT_SERVES_CONTENT: {
		passes: "Every other address of the site (http/https, www/non-www) redirects to the one the site uses.",
		fails: "A second address answers 200 with the site instead of redirecting.",
		ifPasses: "Each page exists at one address, so links and signals all count for that one.",
		example: {
			good: "GET http://example.com/\nHTTP/1.1 301 Moved Permanently\nLocation: https://www.example.com/",
			bad: "GET https://example.com/\nHTTP/1.1 200 OK\n(the same site, served again without www)",
			lang: "http",
		},
		howChecked:
			"After the posts, the crawler asks for the home page at the site's other scheme and at the www and bare-host variants (none for a subdomain such as blog.example.com). Any variant that answers 2xx itself, without redirecting, is reported.",
		manualCheck: [
			"Run curl -sI http://example.com/, curl -sI https://example.com/ and curl -sI https://www.example.com/.",
			"All but one should answer 301 or 308 with a Location pointing to the address the site uses.",
		],
	},
	HOST_REDIRECT_CHAIN: {
		passes: "Other addresses reach the final one in at most two permanent (301/308) hops.",
		fails: "Three or more hops, a temporary 302/303/307 on the way, or a redirect to somewhere else entirely.",
		ifPasses: "Readers and crawlers reach the site in one or two fast, permanent steps.",
		example: {
			good: "GET http://example.com/\n301 → https://www.example.com/",
			bad: "GET http://example.com/\n302 → https://example.com/\n301 → https://www.example.com/\n301 → https://www.example.com/en/",
			lang: "http",
		},
		howChecked:
			"For each other address that redirected, the check counts the hops until the chain reaches the origin the site serves. It fails on three hops or more, on any temporary redirect (302, 303, 307) among them, or when the chain ends somewhere else. Answers cut short by a 429 or a server error are ignored, and what the home page does after reaching the right host (a language redirect) is not counted.",
		manualCheck: [
			"Run curl -sIL http://example.com/ and read each HTTP status and Location in order.",
			"Count the hops to the final address and check that each is 301 or 308.",
		],
	},
	SOFT_404: {
		passes: "An address that cannot exist answers 404 or 410.",
		fails: 'A made-up address answers 200 — a "soft 404".',
		ifPasses:
			"Removed and mistyped addresses drop out of Google cleanly instead of being indexed as error pages.",
		example: {
			good: "GET /this-page-does-not-exist-7f3a\nHTTP/1.1 404 Not Found",
			bad: "GET /this-page-does-not-exist-7f3a\nHTTP/1.1 200 OK\n(a “Page not found” page, or the home page)",
			lang: "http",
		},
		howChecked:
			"The crawler requests one made-up address on the site, following redirects. Any final answer outside 2xx passes; a 2xx — directly or after redirecting, e.g. to the home page — fails. It is not judged when robots.txt forbids the request or there was no answer.",
		manualCheck: [
			"Run curl -sIL https://example.com/this-page-does-not-exist-123 and read the final status.",
			"In Search Console's Page indexing report, look for “Soft 404”.",
		],
	},
	CONTENT_NEEDS_JAVASCRIPT: {
		passes: "Posts arrive with their text in the HTML.",
		fails: "Some posts arrive as an empty JavaScript shell, with text drawn only in the browser.",
		ifPasses:
			"Every crawler can read the post — including the search crawlers of ChatGPT, Claude and Perplexity, which do not run JavaScript.",
		example: {
			good: "<article>\n  <h1>Local SEO checklist</h1>\n  <p>Start with your Business Profile…</p>\n</article>",
			bad: '<body>\n  <div id="root"></div>\n  <script src="/app.js"></script>\n</body>',
			lang: "html",
		},
		howChecked:
			"Among the posts the crawl read, each is flagged when its HTML is an empty client-rendered shell — an empty framework mount point, or a <noscript> asking for JavaScript, with too few words of content. The site check fails when any read post was flagged, and names them.",
		manualCheck: [
			'Open a post and press Ctrl+U: is the article\'s text in the source, or only a <div id="root"> and scripts?',
			'Or run curl -s https://example.com/post/ | grep "a sentence from the article".',
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;

/** How a desktop Core Web Vitals finding is measured: the same call, asking for desktop. */
const DESKTOP_CWV_SOURCE =
	"After each crawl the page joins the queue a second time and is measured with Google PageSpeed Insights, desktop strategy, at most once every 24 hours; only the performance category is asked, so Lighthouse's SEO and accessibility verdicts come from the mobile measurement alone. For each metric the tracker keeps the best evidence Google returns for desktop visits: real Chrome visitors to this page over 28 days, else real visitors to the whole site, else one Lighthouse lab run.";

const PSI_DESKTOP_STEP =
	"Open PageSpeed Insights (https://pagespeed.web.dev), enter the page URL and choose Desktop.";

/** A mobile finding's criteria, told for desktop: the same bands, a different measurement. */
const onDesktop = (criteria: ICheckCriteria): ICheckCriteria => ({
	...criteria,
	howChecked: criteria.howChecked.replace(CWV_SOURCE, DESKTOP_CWV_SOURCE),
	manualCheck: criteria.manualCheck.map((step) => (step === PSI_STEP ? PSI_DESKTOP_STEP : step)),
});

/** The desktop twins of the Core Web Vitals findings: same thresholds, desktop visits. */
export const DESKTOP_CWV_CRITERIA = {
	CWV_LCP_NEEDS_IMPROVEMENT_DESKTOP: onDesktop(SPEED_AND_SITE_CRITERIA.CWV_LCP_NEEDS_IMPROVEMENT),
	CWV_LCP_POOR_DESKTOP: onDesktop(SPEED_AND_SITE_CRITERIA.CWV_LCP_POOR),
	CWV_INP_NEEDS_IMPROVEMENT_DESKTOP: onDesktop(SPEED_AND_SITE_CRITERIA.CWV_INP_NEEDS_IMPROVEMENT),
	CWV_INP_POOR_DESKTOP: onDesktop(SPEED_AND_SITE_CRITERIA.CWV_INP_POOR),
	CWV_CLS_NEEDS_IMPROVEMENT_DESKTOP: onDesktop(SPEED_AND_SITE_CRITERIA.CWV_CLS_NEEDS_IMPROVEMENT),
	CWV_CLS_POOR_DESKTOP: onDesktop(SPEED_AND_SITE_CRITERIA.CWV_CLS_POOR),
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
