import type { TGuideCode } from "@Core/Constants/checkTopics";
import type { ICheckCriteria } from "../criteriaShape";

/** The page's structured data (article, dates, author, breadcrumbs) and the site's name and icon. */
export const STRUCTURED_DATA_AND_IDENTITY_CRITERIA = {
	STRUCTURED_DATA_INVALID: {
		passes: "Every JSON-LD block on the page is valid JSON.",
		fails: "A JSON-LD block cannot be parsed — a trailing comma, an unescaped quote, an empty template variable.",
		ifPasses:
			"Everything the blocks declare reaches Google as written, so the headline, dates, author and breadcrumbs in them can be read and used rather than silently dropped.",
		example: {
			good: [
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "BlogPosting", "headline": "How to plan a content calendar"}',
				"</script>",
			].join("\n"),
			bad: [
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "BlogPosting", "headline": "How to plan a content calendar",}',
				"</script>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker parses every non-empty <script type=\"application/ld+json\"> block in the HTML the server sent. As Google does, it forgives a raw line break or tab inside a string; anything else that is not JSON fails, and the finding quotes the start of the block with the parser's error. A page with no JSON-LD at all is not judged here — that is STRUCTURED_DATA_MISSING's finding.",
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "ld+json" to see each block as the server sends it.',
			"Paste the page URL into the Schema Markup Validator (https://validator.schema.org) or the Rich Results Test (https://search.google.com/test/rich-results); a block that is not JSON is reported as a parsing error.",
			"Or, in the DevTools Console, run document.querySelectorAll('script[type=\"application/ld+json\"]').forEach((s) => { try { JSON.parse(s.textContent) } catch (e) { console.log(e.message, s) } }) to list the blocks that do not parse.",
		],
	},
	DATES_INCONSISTENT: {
		passes: "The page's dates agree with each other and with the calendar.",
		fails: "Modified before published, published in the future, or a year in the URL that the markup does not match.",
		ifPasses:
			"Google has one believable publication date it can show beside the result, and readers do not meet a post that seems updated before it was written or dated next month.",
		example: {
			good: [
				"URL: https://example.com/2026/03/content-calendar/",
				'"datePublished": "2026-03-12T09:00:00+01:00"',
				'"dateModified": "2026-05-02T14:30:00+01:00"',
			].join("\n"),
			bad: [
				"URL: https://example.com/2025/03/content-calendar/",
				'"datePublished": "2026-03-12T09:00:00+01:00"',
				'"dateModified": "2026-03-10T08:00:00+01:00"',
			].join("\n"),
			lang: "text",
		},
		howChecked:
			"The tracker takes datePublished and dateModified from the JSON-LD article node, else from the article:published_time and article:modified_time meta tags, else from the Microdata article. It fails when dateModified is more than a minute earlier than datePublished, when datePublished is more than a day after the crawl fetched the page, or when the URL has a year segment such as /2025/ and the publication date, read as written, names another year. A page with no publication date, or one that does not read as a date, is not judged here.",
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "datePublished", "dateModified" and "published_time".',
			"Compare the two dates with each other, with today's date, and with any year in the page's URL.",
			"Run the page through the Rich Results Test (https://search.google.com/test/rich-results) to see the dates Google reads from the Article item.",
		],
	},
	STRUCTURED_DATA_MISSING: {
		passes: "The page declares an article type — Article, BlogPosting, NewsArticle, TechArticle, ScholarlyArticle, Report or LiveBlogPosting — in JSON-LD or Microdata.",
		fails: "No article structured data is declared.",
		ifPasses:
			"The post becomes eligible for Google's article rich results, and Google reads its headline, author, dates and image from the markup instead of guessing them. It does not rank the page higher by itself.",
		example: {
			good: [
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "BlogPosting", "headline": "How to plan a content calendar"}',
				"</script>",
			].join("\n"),
			bad: [
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "WebPage", "name": "How to plan a content calendar"}',
				"</script>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker collects the @type of every JSON-LD node — each top-level object, each member of an @graph, and an item nested as a WebPage's mainEntity or breadcrumb, which Google reads as if it stood alone — and of every Microdata item (itemtype). A type written as a full address (https://schema.org/BlogPosting) counts as its name. The page passes when any of them is Article, NewsArticle, BlogPosting, TechArticle, ScholarlyArticle, Report or LiveBlogPosting. RDFa is not read, so an article declared only in RDFa is reported here.",
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "@type" and "itemtype" to see which types the page declares.',
			"Paste the URL into the Rich Results Test (https://search.google.com/test/rich-results); an Article item should be listed among the detected items.",
			"In Google Search Console, use URL Inspection on the post and check the enhancements it lists.",
		],
	},
	STRUCTURED_DATA_INCOMPLETE: {
		passes: "The article markup has headline, image, datePublished, dateModified and author.",
		fails: "One or more of those recommended properties is missing.",
		ifPasses:
			"Google gets every fact it can show for an article from the page itself, so the right image, date and author can appear with the result instead of ones Google inferred.",
		example: {
			good: [
				"{",
				'  "@context": "https://schema.org",',
				'  "@type": "BlogPosting",',
				'  "headline": "How to plan a content calendar",',
				'  "image": "https://example.com/images/calendar.jpg",',
				'  "datePublished": "2026-03-12T09:00:00+01:00",',
				'  "dateModified": "2026-05-02T14:30:00+01:00",',
				'  "author": {"@type": "Person", "name": "Jane Doe", "url": "https://example.com/author/jane-doe/"}',
				"}",
			].join("\n"),
			bad: [
				"{",
				'  "@context": "https://schema.org",',
				'  "@type": "BlogPosting",',
				'  "headline": "How to plan a content calendar",',
				'  "image": [],',
				'  "datePublished": "2026-03-12T09:00:00+01:00",',
				'  "author": ""',
				"}",
			].join("\n"),
			lang: "json",
		},
		howChecked:
			"The tracker reads the properties of the page's JSON-LD article nodes, or of its first Microdata article item when there is no JSON-LD one, and lists which of headline, image, datePublished, dateModified and author — the properties Google's Article documentation recommends — are absent. publisher is not among them: Google no longer lists it. A property counts only when it holds something: an empty string or an empty list, as a half-filled CMS template writes them, counts as missing. A page with no article markup is not judged here — that is STRUCTURED_DATA_MISSING's finding.",
		manualCheck: [
			"Paste the URL into the Rich Results Test (https://search.google.com/test/rich-results) and open the Article item; it lists the properties found and warns about missing optional ones.",
			'Or open View source (Ctrl+U), find (Ctrl+F) "ld+json", and check each of the five properties in the article block has a real value, not "" or [].',
		],
	},
	AUTHOR_MARKUP_INCOMPLETE: {
		passes: "Each author is a Person or Organization with a name only and a url or sameAs to a page about them.",
		fails: "An author is a bare string, has no or the wrong @type, no url, only this site's home page as a Person's url, or a name like \"By Jane, Editor\".",
		ifPasses:
			"Google can tell who wrote the post and connect the byline to the right person or organization, so it can credit the author correctly.",
		example: {
			good: [
				"{",
				'  "@type": "BlogPosting",',
				'  "author": [',
				'    {"@type": "Person", "name": "Jane Doe", "url": "https://example.com/author/jane-doe/"},',
				'    {"@type": "Person", "name": "John Roe", "url": "https://example.com/author/john-roe/"}',
				"  ]",
				"}",
			].join("\n"),
			bad: [
				"{",
				'  "@type": "BlogPosting",',
				'  "author": {"@type": "Person", "name": "By Jane Doe and John Roe", "url": "https://example.com/"}',
				"}",
			].join("\n"),
			lang: "json",
		},
		howChecked:
			'The tracker reads the article markup\'s author — JSON-LD first, following an @id reference to the node it names, else Microdata — and judges each distinct author. It reports an author given as a plain string; a @type other than Person or an Organization type; no url or sameAs, or, for a Person, only urls that are the home page of the site the article is on (an organization\'s home page, or a person\'s own site, does identify the author); and a name that is missing, starts with "By", "Posted by", "Author:" or an honorific such as "Dr.", carries the publisher after " @ " or " | ", or, for a Person, reads as several people or a title ("and", "&", a comma, a slash). It is not judged when the markup names no author, or when nothing on the page names one.',
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "author" in the ld+json block; if it is only an @id, find that @id to see the Person node.',
			"Check each author has a @type of Person or Organization, a name with nothing but the name, and a url or sameAs that opens a page about them, not the home page.",
			"Paste the URL into the Schema Markup Validator (https://validator.schema.org) to see the author nodes as they resolve.",
		],
	},
	ARTICLE_DATE_FORMAT_INVALID: {
		passes: "Dates are ISO 8601 — 2026-10-03, or 2026-10-03T09:00:00+02:00 with a time.",
		fails: 'A date is not ISO 8601 ("03/10/2026"), or gives a time of day without a time zone.',
		ifPasses:
			"Google reads the dates exactly as meant, in the right time zone, so the date it can show with the result is the one the post was given.",
		example: {
			good: [
				"{",
				'  "@type": "BlogPosting",',
				'  "datePublished": "2026-03-12",',
				'  "dateModified": "2026-05-02T14:30:00+01:00"',
				"}",
			].join("\n"),
			bad: [
				"{",
				'  "@type": "BlogPosting",',
				'  "datePublished": "12/03/2026",',
				'  "dateModified": "2026-05-02T14:30:00"',
				"}",
			].join("\n"),
			lang: "json",
		},
		howChecked:
			'The tracker reads the same datePublished and dateModified as DATES_INCONSISTENT — JSON-LD article, else article:published_time and article:modified_time meta tags, else Microdata — as written. A value passes when it is a real calendar date in the form YYYY-MM-DD (no February 30th), alone or followed by "T" and a real time of day (no hour 25) that ends in Z or an offset such as +01:00, +0100 or +01. Any other form fails as "not an ISO 8601 date", and a time with no zone fails on its own.',
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "datePublished", "dateModified" and "published_time".',
			"Check each value reads like 2026-03-12 or 2026-03-12T09:00:00+01:00, with a T between date and time and a Z or offset after the time.",
		],
	},
	ARTICLE_HEADLINE_MISMATCH: {
		passes: "The markup's headline shares at least half its words with the <title> or the <h1>.",
		fails: "The headline shares fewer than half its words with both — usually a template printing the site name.",
		ifPasses:
			"The markup and the visible page tell Google the same thing about the post, so Google has no reason to distrust the markup.",
		example: {
			good: [
				"<title>How to plan a content calendar</title>",
				"<h1>How to plan a content calendar</h1>",
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "BlogPosting", "headline": "Plan a content calendar in 5 steps"}',
				"</script>",
			].join("\n"),
			bad: [
				"<title>How to plan a content calendar</title>",
				"<h1>How to plan a content calendar</h1>",
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "BlogPosting", "headline": "Example Blog - marketing tips for small teams"}',
				"</script>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker takes the headline of the JSON-LD article (else the Microdata article's headline or name) and splits it into distinct lower-cased words, the way the browser's word segmenter does, so languages without spaces split too. It counts what share of those words also appear in the <title>, and in each <h1>, and passes when the best share is at least half. A reworded or shortened headline usually keeps enough words to pass; it is not judged when there is no headline, or no title or h1 to compare with.",
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "headline" in the ld+json block.',
			"Compare it word by word with the <title> and the <h1>; at least half the headline's words should appear in one of them.",
			"Open two or three other posts: a headline that is the same on every post is a template filling in a fixed value.",
		],
	},
	BREADCRUMB_MISSING: {
		passes: "The page declares a BreadcrumbList in JSON-LD or Microdata.",
		fails: "No BreadcrumbList is declared.",
		ifPasses:
			"The page becomes eligible for a breadcrumb trail such as Blog › SEO in place of the bare URL in its result, and Google learns where the page sits in the site.",
		example: {
			good: [
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [',
				'  {"@type": "ListItem", "position": 1, "name": "Blog", "item": "https://example.com/blog/"},',
				'  {"@type": "ListItem", "position": 2, "name": "SEO", "item": "https://example.com/blog/seo/"},',
				'  {"@type": "ListItem", "position": 3, "name": "How to plan a content calendar"}',
				"]}",
				"</script>",
			].join("\n"),
			bad: '<nav class="breadcrumbs"><a href="/blog/">Blog</a> › <a href="/blog/seo/">SEO</a> › How to plan a content calendar</nav>',
			lang: "html",
		},
		howChecked:
			"The tracker looks for a BreadcrumbList among the JSON-LD types (top-level objects, @graph members, and a trail nested as a WebPage's breadcrumb) and the Microdata itemtypes of the HTML the server sent. Any declared trail passes, even a one-step one; whether it is complete is BREADCRUMB_INVALID's question. A visible trail without markup, or one in RDFa only, fails; a BreadcrumbList that only an inline script inserts later, as Next.js sites do, is not judged.",
		manualCheck: [
			'Open View source (Ctrl+U) and find (Ctrl+F) "BreadcrumbList".',
			"Paste the URL into the Rich Results Test (https://search.google.com/test/rich-results); a Breadcrumbs item should be detected.",
			"In Google Search Console, the Breadcrumbs report under Enhancements lists the pages where Google found the markup.",
		],
	},
	BREADCRUMB_INVALID: {
		passes: "Every JSON-LD trail has ListItems, each with an integer position and a name, and an item URL on every step but the last. A trail of a single step is not judged.",
		fails: "A step lacks its position, name or item URL, or a BreadcrumbList has no ListItem at all.",
		ifPasses:
			"Google can use the trail as declared, so the result can show the full path instead of dropping it.",
		example: {
			good: [
				"{",
				'  "@context": "https://schema.org",',
				'  "@type": "BreadcrumbList",',
				'  "itemListElement": [',
				'    {"@type": "ListItem", "position": 1, "name": "Blog", "item": "https://example.com/blog/"},',
				'    {"@type": "ListItem", "position": 2, "name": "How to plan a content calendar"}',
				"  ]",
				"}",
			].join("\n"),
			bad: [
				"{",
				'  "@context": "https://schema.org",',
				'  "@type": "BreadcrumbList",',
				'  "itemListElement": [',
				'    {"@type": "ListItem", "name": "Blog"},',
				'    {"@type": "ListItem", "position": 2, "name": "How to plan a content calendar"}',
				"  ]",
				"}",
			].join("\n"),
			lang: "json",
		},
		howChecked:
			'The tracker reads every JSON-LD BreadcrumbList, following @id references, and checks each ListItem in itemListElement. A position must be a whole number; the name may sit on the ListItem or on its item; the item URL is the item itself or its @id or url, and the last step may leave it out because Google uses the page\'s own URL. A list with no ListItem fails, a single-step trail (such as the lone "Home" some SEO plugins write) is let through, and Microdata trails are not judged here.',
		manualCheck: [
			"Paste the URL into the Rich Results Test (https://search.google.com/test/rich-results) and open the Breadcrumbs item; missing position, name or item is reported as an error.",
			'Or open View source (Ctrl+U), find (Ctrl+F) "BreadcrumbList", and check each ListItem has a number position, a name and, except the last, an item URL.',
		],
	},
	FAVICON_INVALID: {
		passes: "The home page declares — or /favicon.ico serves — a square icon of at least 8×8 px in a format Google reads (not SVG-only), crawlable by Googlebot-Image.",
		fails: "The icon is missing, blocked, unreadable, not square, too small or only SVG, and /favicon.ico is no usable icon either.",
		ifPasses:
			"Every result from the site shows its own icon instead of Google's generic one, which makes the site's results easier to recognise.",
		example: {
			good: [
				'<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
				'<link rel="icon" href="/favicon-48x48.png" type="image/png" sizes="48x48">',
			].join("\n"),
			bad: [
				'<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
				"<!-- and https://example.com/favicon.ico answers 404 -->",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			'The tracker reads the home page of the host the posts were served from and its <link rel="icon">, "shortcut icon" and apple-touch-icon links, and picks the first in a format Google supports (BMP, GIF, ICO, PNG, JPEG, PPM, TIFF) or that names no format; with no icon link — or only icons inlined as data: URIs, which no crawler can fetch — it uses /favicon.ico. It asks the served host\'s robots.txt whether Googlebot-Image may fetch that file, then fetches its first bytes and reads the real format and pixel size from them — failing an address that is blocked, does not answer 200, returns an HTML page or an unsupported format, or holds an image that is not square or under 8×8 px (for an ICO, its largest image). When the chosen icon fails but /favicon.ico is a usable icon, the site passes.',
		manualCheck: [
			'Open the home page\'s View source (Ctrl+U) and find (Ctrl+F) "rel=\\"icon\\"" and "apple-touch-icon" to see which icons it declares.',
			"Run curl -I https://example.com/favicon-48x48.png (the declared address, or /favicon.ico when none is declared) and check it answers 200 with an image content-type.",
			"Run curl -s https://example.com/robots.txt | grep -i -A5 googlebot-image, and check no Disallow rule covers the icon.",
			"Open the icon address in the browser and check in DevTools (Network panel, Preview) that it is square and at least 8×8 px — 48×48 px or more looks best.",
		],
	},
	SITE_NAME_NOT_DECLARED: {
		passes: "The home page has WebSite structured data with a name.",
		fails: "The home page declares no WebSite name.",
		ifPasses:
			"Google is told the name the site wants shown above its results, which makes that name more likely to appear rather than one Google derives from the title or the domain.",
		example: {
			good: [
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "WebSite", "name": "Example Blog", "url": "https://example.com/"}',
				"</script>",
			].join("\n"),
			bad: '<meta property="og:site_name" content="Example Blog">',
			lang: "html",
		},
		howChecked:
			"Once per crawl, the tracker reads the home page of the host the posts were served from and looks for a WebSite node with a non-empty name — in JSON-LD (a top-level object or an @graph member) or in Microdata. og:site_name alone does not pass; when it is there, the finding quotes it.",
		manualCheck: [
			'Open the home page\'s View source (Ctrl+U) and find (Ctrl+F) "WebSite" in the ld+json blocks; it should carry a "name".',
			"Paste the home page URL into the Schema Markup Validator (https://validator.schema.org) and check a WebSite item with a name is listed.",
		],
	},
	SITE_NAME_INCONSISTENT: {
		passes: "The WebSite name and og:site_name agree, or one is listed as an alternateName.",
		fails: "The two names differ and neither is listed as an alternate.",
		ifPasses:
			"Google's sources for the site name agree, so it is far more likely to show the name the site chose instead of picking between two.",
		example: {
			good: [
				'<meta property="og:site_name" content="Example Blog">',
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "WebSite", "name": "Example Marketing Blog", "alternateName": ["Example Blog"], "url": "https://example.com/"}',
				"</script>",
			].join("\n"),
			bad: [
				'<meta property="og:site_name" content="Example Blog">',
				'<script type="application/ld+json">',
				'{"@context": "https://schema.org", "@type": "WebSite", "name": "Example Marketing Agency", "url": "https://example.com/"}',
				"</script>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			'On the same home page, the tracker compares og:site_name with the name and every alternateName of each WebSite node (JSON-LD or Microdata). Case, spaces, punctuation and symbols are ignored, so "Search Engine Land" equals "search-engine land"; one match passes. It is not judged when either name is absent.',
		manualCheck: [
			'Open the home page\'s View source (Ctrl+U) and find (Ctrl+F) "og:site_name" and "WebSite".',
			"Check the og:site_name text matches the WebSite name, or appears in its alternateName list.",
			"Run a site: search on Google (site:example.com) to see which name Google currently shows above the results.",
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
