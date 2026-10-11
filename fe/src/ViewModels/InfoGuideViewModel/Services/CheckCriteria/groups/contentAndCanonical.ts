import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import type { TGuideCode } from "@Core/Constants/checkTopics";
import type { ICheckCriteria } from "../criteriaShape";

const C = SEO_ISSUE_CATALOGUE;

/** Content quality (length, author, honest dates, copies, rivals, sources) and canonical URLs. */
export const CONTENT_AND_CANONICAL_CRITERIA = {
	// ── Content quality ──────────────────────────────────────────────────────────────
	THIN_CONTENT: {
		passes: `The main content has at least ${C.THIN_CONTENT.min} words.`,
		fails: `The main content has fewer than ${C.THIN_CONTENT.min} words — a heuristic, not a Google rule.`,
		ifPasses:
			"A post of this length usually has room to answer the search in full — and a complete answer, not the word count itself, is what Google's systems reward. Readers who land on it get an answer rather than a teaser.",
		example: {
			good: "A 1,200-word post that answers the question in its title, walks through the steps with examples, and covers the follow-up questions a reader is likely to have.",
			bad: 'A 180-word post: two paragraphs introducing the topic, then "Read the full guide" linking to another page.',
			lang: "text",
		},
		howChecked: `The tracker finds the post's main text — the <article> holding the <h1>, else <main>, else a single named content container such as .entry-content, else the <body> — and removes scripts, navigation, header, footer, sidebars, forms, share buttons, related posts and comments. Every token containing a letter or digit counts as a word (Chinese and Japanese text is split into dictionary words), and the page fails under ${C.THIN_CONTENT.min}. Pages under 120 words are not crawled as posts at all, so this check always applies to what it sees.`,
		manualCheck: [
			"Open the post and, in Chrome DevTools' Elements panel, find the element that holds the post's text — usually <article> or <main>.",
			'In the Console, run [...document.querySelectorAll("article")][0].innerText.split(/\\s+/).filter(Boolean).length, using the element you found instead of "article".',
			"Subtract what sits inside it but is not the post — share buttons, an author box, related posts, comments; the tracker does not count them.",
			"Read the post and decide whether it fully answers the question its title asks.",
		],
	},
	AUTHOR_MISSING: {
		passes: 'Something on the page says who wrote it: article markup, <meta name="author">, rel="author" or a marked-up byline.',
		fails: "Nothing on the page names an author.",
		ifPasses:
			"Readers can see who wrote the post and judge the expertise behind it, as Google's helpful-content guidance suggests. It is not a ranking switch; it gives readers a reason to trust the page.",
		example: {
			good: [
				'<meta name="author" content="Jane Doe">',
				"…",
				'<p class="byline">By <a href="https://example.com/author/jane-doe/">Jane Doe</a></p>',
			].join("\n"),
			bad: '<p class="byline">By Jane Doe</p>',
			lang: "html",
		},
		howChecked:
			'The page passes when the tracker finds any one of: a named author on the Article or BlogPosting item of its JSON-LD (an "@id" reference to a named person counts), a non-empty <meta name="author">, an <a> or <link> with rel="author" (a link to a humans.txt credits file does not count), an element with itemprop="author", a byline the theme marks with a class — WordPress\'s post-author-name block, class="byline", or a class containing author-name — or a link anywhere on the page to this site\'s author archive — a path ending in /author/<slug>/ (or authors, contributor, contributors). The check always applies.',
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to look for name="author", rel="author" and itemprop="author".',
			'Search the JSON-LD for "author" and check it sits on the Article or BlogPosting item and has a "name".',
			"Search for /author/ to find a byline that links to the author's page.",
			"Paste the URL into the Rich Results Test (https://search.google.com/test/rich-results) and check the Article item shows an author.",
		],
	},
	DATE_BUMPED_WITHOUT_CHANGES: {
		passes: "Since the previous crawl the modification date stayed the same, or the text changed with it.",
		fails: "The declared modification date moved while the main text stayed word-for-word the same.",
		ifPasses:
			"The updated date readers see — and Google may show in results — means something: it moved because the post did. The site avoids a pattern Google's guidance names as a mark of content made for search engines.",
		example: {
			good: [
				"Crawl of 1 Oct: dateModified 2026-09-02, main text unchanged since",
				"Crawl of 8 Oct: dateModified 2026-09-02, main text the same",
				"(or: dateModified 2026-10-07 and a new section added)",
			].join("\n"),
			bad: [
				"Crawl of 1 Oct: dateModified 2026-09-02",
				"Crawl of 8 Oct: dateModified 2026-10-07, main text word for word the same",
			].join("\n"),
			lang: "text",
		},
		howChecked:
			"With each crawl the tracker stores the post's declared modification date — dateModified on the article's JSON-LD, else <meta property=\"article:modified_time\">, else the article's microdata — and a SHA-256 fingerprint of its main text (template, sidebars and comments removed). On the next crawl of the same URL it fails the post when the date names a different moment from the stored one — the same moment written another way (Z or +00:00) is the same date — while the fingerprint is identical; a new date over changed text, or an unchanged date, passes. Not applicable on the first crawl of the URL, when the post declares no modification date now, or when the previous crawl recorded no date for it.",
		manualCheck: [
			"Open View source (Ctrl+U), use Ctrl+F to find dateModified and article:modified_time, and note the values with today's date.",
			"Compare them with the two dates the tracker's finding quotes, and compare the post's text with what was there on the earlier date.",
			"If nobody edited the post, view the source again after the site's next deploy or an unrelated save: a date that moves every time is set by the CMS or a plugin.",
		],
	},
	NEAR_DUPLICATE_CONTENT: {
		passes: "No other crawled page repeats most of this page's main text.",
		fails: "Most of the main text appears, nearly word for word, on another page of the crawl.",
		ifPasses:
			"Each page is the only version of its text, so Google has no copies to group and choose between, and each page can earn its own place in results.",
		example: {
			good: "/plumber-toronto/ and /plumber-ottawa/ each describe local prices, permits and service areas in their own words.",
			bad: "/plumber-toronto/ and /plumber-ottawa/ are the same 600 words with the city name swapped.",
			lang: "text",
		},
		howChecked:
			"The tracker takes the paragraphs of each post's main text (template, navigation, sidebars and headings left out), lower-cases them, strips punctuation and cuts the text into overlapping five-word sequences. For every pair of posts in the same crawl — at most 15 — it measures the share of their distinct sequences that both hold (Jaccard similarity) and fails both posts when it is 0.6 or more. A post with fewer than 50 distinct sequences (roughly 55 words), or a crawl of a single post, is not judged.",
		manualCheck: [
			"Open this page and the page the finding names side by side and compare their text.",
			'Copy a distinctive sentence from this page and search Google for it in quotes with site:, e.g. site:example.com "the exact sentence".',
			'In View source (Ctrl+U) of each page, use Ctrl+F to find rel="canonical" and see whether one already names the other.',
		],
	},
	KEYWORD_CANNIBALISATION: {
		passes: "No other crawled page leads with the same top keyword.",
		fails: "Two or more crawled pages have the same top keyword — a sign they may compete for one query, not proof.",
		ifPasses:
			"Each post leads with its own subject, so the site's posts are less likely to take turns in results for one query, and the links each earns point to one clear answer.",
		example: {
			good: [
				'"What is AI marketing?" → top keyword: ai marketing',
				'"10 AI marketing tools we tested" → top keyword: ai marketing tools',
			].join("\n"),
			bad: [
				'"What is AI marketing?" → top keyword: ai marketing',
				'"AI Marketing Guide" → top keyword: ai marketing',
			].join("\n"),
			lang: "text",
		},
		howChecked:
			"The tracker extracts 1–8 keywords per post from its title, headings, URL slug, meta description and main text, weighting where a phrase appears and fading terms that appear on every post of the crawl, such as the brand. It compares each post's top keyword (lower case, punctuation removed) with the top keyword of every other post in the same crawl and fails each post whose top keyword another one shares. Two posts that are language versions of each other — either names the other in hreflang, or their <html lang> differ — are not compared. Not applicable to a crawl of one post or to a post with no keyword.",
		manualCheck: [
			"Search Google for the keyword limited to the site, e.g. site:example.com ai marketing, and see which of the pages come up.",
			"Open both pages and compare their <title>, <h1> and the question each one answers (View source, Ctrl+F for <title and <h1).",
			"Decide whether they say the same thing (merge them) or answer different questions (give each its own angle).",
		],
	},
	NO_EXTERNAL_SOURCES: {
		passes: "A long text links to at least one other website.",
		fails: `The main text runs to ${C.THIN_CONTENT.min} words or more and none of its links leaves the site.`,
		ifPasses:
			"Readers — and the AI assistants that quote pages — can check where the post's facts and figures come from, which Google's guidance lists among the signs of trustworthy content.",
		example: {
			good: '<p>Most searches now start on a phone (<a href="https://research.example.org/mobile-search-2026">Example Research, 2026</a>).</p>',
			bad: '<p>Most searches now start on a phone (<a href="https://blog.example.com/mobile-stats/">our stats</a>).</p>',
			lang: "html",
		},
		howChecked: `Only posts whose main text runs to ${C.THIN_CONTENT.min} words or more are judged; shorter ones are not applicable. The tracker reads the http(s) links inside the main text — navigation, sidebars, share buttons and related posts are already removed — and passes the post when at least one points to a different registered domain than the page's own. Subdomains count as the same site: on www.example.com, a link to blog.example.com or shop.example.com cites nothing.`,
		manualCheck: [
			"Open the post and find the element holding its text in Chrome DevTools' Elements panel (usually <article> or <main>).",
			'In the Console, run [...document.querySelectorAll("article a[href]")].map(a => a.href) and look for any address outside your own domain.',
			"Read the post for statistics, studies and quotes, and check that each one links to where it comes from.",
		],
	},

	// ── Canonical URLs ───────────────────────────────────────────────────────────────
	CANONICAL_MISSING: {
		passes: 'The page declares a canonical — <link rel="canonical"> in <head>, or a Link header.',
		fails: "No canonical is declared (one written in <body> does not count — Google ignores it).",
		ifPasses:
			"Google is told which address you prefer, so it is more likely to show that address in results and to credit links pointing at the page's other addresses to it.",
		example: {
			good: [
				"<head>",
				'  <link rel="canonical" href="https://example.com/blog/seo-checklist/">',
				"</head>",
			].join("\n"),
			bad: [
				"<body>",
				'  <link rel="canonical" href="https://example.com/blog/seo-checklist/">',
				"</body>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			'The tracker collects each <link rel="canonical"> with a non-empty href inside <head>, as an HTML parser builds it — an element that cannot sit in <head>, such as an <img>, ends the head early and pushes the tags after it into <body> — and each rel="canonical" entry of the Link response header. The page passes with at least one. A canonical found in <body> does not count; the finding quotes it. The check always applies.',
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to find rel="canonical".',
			"In Chrome DevTools' Elements panel, check that the tag sits under <head>, not under <body>.",
			'Run curl -I https://example.com/blog/your-post/ and look for a link: header with rel="canonical".',
			'In Google Search Console, URL Inspection shows the "User-declared canonical" Google read.',
		],
	},
	CANONICAL_MISMATCH: {
		passes: "The canonical names this very page.",
		fails: "The canonical names a different URL, so Google will usually index that one instead.",
		ifPasses:
			"The page claims itself as the main version, so Google can index and show it under its own address.",
		example: {
			good: [
				"<!-- served at https://example.com/blog/seo-checklist/ -->",
				'<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
			].join("\n"),
			bad: [
				"<!-- served at https://example.com/blog/seo-checklist/ -->",
				'<link rel="canonical" href="https://example.com/blog/">',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker takes the first canonical the page declares — the <head> tag before the Link header — and compares it with the URL the page was finally served at, after redirects. Scheme, host, path and query must match; a trailing slash and a #fragment are ignored. Not applicable without a canonical, when the canonical is the page's own address over http:// (CANONICAL_TO_HTTP reports that), or when the crawl read the target and found it broken (CANONICAL_TARGET_BROKEN reports that).",
		manualCheck: [
			'Open View source (Ctrl+U), use Ctrl+F to find rel="canonical", and compare its href with the address bar after the page has loaded.',
			"Run curl -I on the page's URL to see any redirect and any canonical in a link: header.",
			'In Google Search Console, URL Inspection shows the "User-declared canonical" and the "Google-selected canonical" side by side.',
		],
	},
	CANONICAL_TO_HTTP: {
		// Corrected: any https:// canonical passes this check; one naming another page is CANONICAL_MISMATCH's.
		passes: "An HTTPS page's canonical is an https:// address.",
		fails: "The page is served over HTTPS but declares its own http:// address as canonical.",
		ifPasses:
			'The canonical agrees with Google\'s own preference for HTTPS, so the secure address — not the one browsers label "Not secure" — is the one Google is asked to show.',
		example: {
			good: '<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
			bad: '<link rel="canonical" href="http://example.com/blog/seo-checklist/">',
			lang: "html",
		},
		howChecked:
			"Only pages served over HTTPS that declare a canonical are judged. The tracker takes the first declared canonical (the <head> tag before the Link header): one that does not start with http:// passes, and one that is this page's own address over http:// (a trailing slash aside) fails. An http:// canonical naming a different page is left to CANONICAL_MISMATCH.",
		manualCheck: [
			'Open View source (Ctrl+U), use Ctrl+F to find rel="canonical", and check its href starts with https://.',
			'Run curl -I on the page\'s URL and check any link: header with rel="canonical" starts with https:// too.',
			"If every page shows http://, check the site address setting in the CMS or SEO plugin.",
		],
	},
	CANONICAL_CONFLICT: {
		passes: "Every canonical the page declares names the same URL.",
		fails: "Two canonical tags, or a tag and a Link header, name different URLs.",
		ifPasses:
			"The page gives Google one consistent hint, which Google can follow instead of choosing the canonical by itself.",
		example: {
			good: [
				'<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
				'<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
			].join("\n"),
			bad: [
				'<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
				'<link rel="canonical" href="https://example.com/blog/seo-checklist/?amp=1">',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			'The tracker gathers every canonical the page declares — each <link rel="canonical"> in <head> and each rel="canonical" entry of the Link header — resolved to full URLs without #fragments. The same URL repeated passes; two or more different URLs fail. URLs are compared exactly, so /post and /post/ count as two. Not applicable when the page declares no canonical.',
		manualCheck: [
			'Open View source (Ctrl+U) — the HTML as served, which is what the tracker reads — and use Ctrl+F to count rel="canonical".',
			"Run curl -I on the page's URL and check whether a link: header names a canonical too.",
			"If two differ, look for a theme and an SEO plugin each adding their own tag.",
		],
	},
	CANONICAL_TARGET_BROKEN: {
		// Corrected: a target with no canonical of its own passes, as does any answer below 400 without a redirect,
		// and only a missing domain or a redirect loop counts as unreachable — a timeout is not judged.
		passes: "The page the canonical names answers without a redirect or an error, is indexable and names no other URL as its canonical — or the canonical names this page itself.",
		fails: "The named page redirects, answers an HTTP error, has a domain that does not exist or loops in redirects, is noindex, or names yet another URL as its canonical.",
		ifPasses:
			"The page's signals are pointed at a live, indexable address that Google can settle on and show, rather than at an address it has to ignore.",
		example: {
			good: [
				'# canonical: <link rel="canonical" href="https://example.com/blog/seo-checklist-2026/">',
				"$ curl -I https://example.com/blog/seo-checklist-2026/",
				"HTTP/2 200",
				"content-type: text/html; charset=utf-8",
			].join("\n"),
			bad: [
				'# canonical: <link rel="canonical" href="https://example.com/blog/old-checklist/">',
				"$ curl -I https://example.com/blog/old-checklist/",
				"HTTP/2 301",
				"location: https://example.com/blog/seo-checklist-2026/",
			].join("\n"),
			lang: "http",
		},
		howChecked:
			"When the first declared canonical names another URL, the crawl requests it — at most 30 such documents per crawl (canonical targets before hreflang alternates), only where that host's robots.txt allows, within the crawl's 60-second window for outside requests; a target that is one of the crawl's own posts is judged from its own fetch. It fails when the target redirects (even once), answers 400 or above, has a domain that does not exist, loops in redirects, is noindex for Google (noindex or none in meta robots, meta googlebot or X-Robots-Tag), or declares a canonical other than itself. A canonical naming the page itself passes. Not applicable without a canonical, when it is the page's own http:// address or a development host, or when the target was not requested or did not answer (timeout, network error).",
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to find rel="canonical"; copy its href.',
			"Run curl -I on that address: it should answer 200 directly, with no location: header and no x-robots-tag: noindex.",
			'Open that address, View source, and use Ctrl+F to check it has no "noindex" and that its own rel="canonical" names itself.',
			"In Google Search Console, run URL Inspection on the canonical address to see whether Google can index it.",
		],
	},
	DEVELOPMENT_HOST_REFERENCES: {
		passes: "Nothing on the page points at a development or staging address.",
		// Corrected: what names the page itself fails for any IP address and any staging/preview host; content links
		// and loaded files fail only for this site's own development addresses.
		fails: "The canonical, og:url or hreflang points at localhost, an IP address, or a staging, dev or preview host; or a content link or loaded file points at this site's own localhost, private IP, staging or preview address.",
		ifPasses:
			"Signals stay with the live site, readers never follow a link to or load a file from a server they cannot reach, and test environments stay unadvertised.",
		example: {
			good: [
				'<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
				'<meta property="og:url" content="https://example.com/blog/seo-checklist/">',
				'<img src="https://example.com/uploads/chart.png" alt="Search share by device">',
			].join("\n"),
			bad: [
				'<link rel="canonical" href="https://staging.example.com/blog/seo-checklist/">',
				'<img src="http://localhost:3000/uploads/chart.png" alt="Search share by device">',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker reads the canonical (tag and Link header), og:url and hreflang links and fails if any points at a development address: localhost or *.local, any IP address, a host of three or more labels that starts with staging, stage, stg, dev, develop, development, test, testing, qa, uat, preview or sandbox, or a platform preview domain such as *.vercel.app, *.netlify.app, *.pages.dev or *.herokuapp.com. Links in the main text and files the page loads (images, scripts, stylesheets, frames, audio and video) are read more strictly, because other sites' dev-looking hosts are real sites: they fail only for localhost, a private IP, an environment label over this site's own domain (staging.example.com) or a platform preview named after the site. The host the page itself is served from never counts, and the check always applies.",
		manualCheck: [
			"Open View source (Ctrl+U) and use Ctrl+F for localhost, staging., dev., preview, .vercel.app and .netlify.app.",
			'Check the rel="canonical", og:url and hreflang links in particular — they must name the live address.',
			"In Chrome DevTools' Network panel, reload the page and look for files loaded from a non-production host (requests to localhost fail in red).",
		],
	},
	CANONICAL_RELATIVE: {
		passes: "The canonical is a full URL with scheme and host.",
		fails: 'The canonical is written as a path, such as href="/post/".',
		ifPasses:
			"The canonical names the real page wherever a copy of the HTML is served — a staging host, an http:// or www mirror — so copies point to the original instead of each claiming to be it.",
		example: {
			good: '<link rel="canonical" href="https://example.com/blog/seo-checklist/">',
			bad: '<link rel="canonical" href="/blog/seo-checklist/">',
			lang: "html",
		},
		howChecked:
			'Only pages that declare a canonical are judged. The tracker reads the href of every <link rel="canonical"> in <head> as written and fails the page if any has no scheme — a path such as /post/, or a protocol-relative //example.com/post/. A canonical in the Link header is not judged here.',
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to find rel="canonical".',
			"Check its href starts with https:// and the domain; one starting with / or // is relative.",
			"Fix it in the SEO plugin or the page template, which most plugins already write as a full address.",
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
