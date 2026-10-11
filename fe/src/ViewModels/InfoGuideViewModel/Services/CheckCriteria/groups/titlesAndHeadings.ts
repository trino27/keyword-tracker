import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import type { ICheckCriteria, TGuideCode } from "../checkTopics";

const C = SEO_ISSUE_CATALOGUE;

/** The search result's headline and snippet, and the page's outline of headings. */
export const TITLES_AND_HEADINGS_CRITERIA = {
	TITLE_MISSING: {
		topic: "titles",
		passes: "The page has a non-empty <title> in its <head>.",
		fails: "There is no <title>, or it is empty.",
		ifPasses:
			"Search results can show the headline you wrote instead of one Google assembles from headings or link text, and browser tabs and bookmarks name the page properly.",
		example: {
			good: "<head>\n  <title>How to Build Backlinks That Last | Example Blog</title>\n</head>",
			bad: '<head>\n  <meta property="og:title" content="How to Build Backlinks That Last">\n</head>\n<body>\n  <svg><title>Example Blog logo</title></svg>',
			lang: "html",
		},
		howChecked:
			"The tracker reads the first <title> inside <head> of the HTML the server returns, with runs of whitespace collapsed. The check fails when there is none or it holds only whitespace. A <title> anywhere else, such as inside an SVG in the body, does not count, and an og:title is quoted in the finding as a ready-made fix but never accepted as the title.",
		manualCheck: [
			"Open the page and press Ctrl+U to view its source.",
			"Press Ctrl+F and search for <title.",
			"Confirm the match sits between <head> and </head>, is not inside an <svg>, and has text between its tags.",
		],
	},
	TITLE_LENGTH: {
		topic: "titles",
		passes: `The title is ${C.TITLE_LENGTH.min}–${C.TITLE_LENGTH.max} characters long.`,
		fails: `The title is shorter than ${C.TITLE_LENGTH.min} or longer than ${C.TITLE_LENGTH.max} characters.`,
		ifPasses:
			"The headline fits the width of a search result, so searchers read it whole, including the words that make it worth clicking.",
		example: {
			good: "<title>How to Build Backlinks That Last | Example Blog</title>",
			bad: "<title>SEO tips</title>",
			lang: "html",
		},
		howChecked: `The tracker takes the title from <head> (whitespace runs collapsed to one space, ends trimmed) and counts its characters as a reader does, so an accented letter or a Cyrillic letter is one character. The check fails below ${C.TITLE_LENGTH.min} or above ${C.TITLE_LENGTH.max}; both bounds themselves pass. A page with no title is skipped, because TITLE_MISSING reports it.`,
		manualCheck: [
			"Open the page in Chrome and open DevTools (F12), then the Console.",
			"Run document.querySelectorAll('head > title')[0].text.trim().length to get the length.",
			`Compare the number with ${C.TITLE_LENGTH.min}–${C.TITLE_LENGTH.max}, then search Google for site: plus the page URL to see whether the headline is cut off.`,
		],
	},
	TITLE_SCRIPT_MISMATCH: {
		topic: "titles",
		passes: "The title has at least one word in the writing system of the page's text (a Latin brand name beside it is fine).",
		fails: "The title has no letter of the page's script — for example an English title over a Russian article.",
		ifPasses:
			"Searchers who read the page's language see a headline in that language, and Google has one less reason to replace your title with text of its own.",
		example: {
			good: '<html lang="ru">\n<head>\n  <title>Google Analytics 4: полное руководство</title>\n</head>\n<body>\n  <article>\n    <h1>Полное руководство по веб-аналитике</h1>\n    <p>Разбираем, как настроить отчёты и цели за один вечер.</p>',
			bad: "<head>\n  <title>Google Analytics 4: The Complete Guide</title>\n</head>\n<body>\n  <article>\n    <h1>Полное руководство по веб-аналитике</h1>\n    <p>Разбираем, как настроить отчёты и цели за один вечер.</p>",
			lang: "html",
		},
		howChecked:
			"The tracker counts the letters of the post's main content (its headings and paragraphs, without navigation, sidebars and footers) by writing system: Latin, Cyrillic, Greek, Arabic, Hebrew, Chinese/Japanese as one, Korean, Thai, Devanagari, Georgian, Armenian. The page's script is named only when the text has at least 30 such letters and one script holds at least 80% of them; otherwise, or without a title, the check is skipped. It fails only when the title has letters and none of them is in the page's script — a title of digits and punctuation, or one mixing the page's script with a Latin brand, passes.",
		manualCheck: [
			"Open the page and press Ctrl+U to view its source.",
			"Press Ctrl+F, search for <title and read the title next to the first paragraphs of the post.",
			"If the title has no word in the alphabet of the post, search Google for site: plus the page URL and see whether Google shows a different headline.",
		],
	},
	TITLE_YEAR_OUTDATED: {
		topic: "titles",
		passes: 'The title offers no past year as its date: no earlier year ends it or follows "in" or "for".',
		fails: 'The title, read without the site name after its separator, ends with a year, or says "in 2023" / "for 2023", and that year has already passed.',
		ifPasses:
			"The headline does not tell searchers the post is out of date before they open it, so an evergreen or refreshed post keeps earning its clicks.",
		example: {
			good: "<title>Best SEO tools for small sites, tested | Example Blog</title>\n<!-- also passes: the years are the subject, not a date -->\n<title>2024 vs 2025: what changed for small sites</title>",
			bad: "<title>Best SEO tools for 2024 | Example Blog</title>\n<title>Content audit checklist (2023)</title>",
			lang: "html",
		},
		howChecked:
			'The tracker cuts the site name off the title at a spaced separator (" | ", " - ", " – ", " — ", " • ", " · ") and looks for standalone years from 1900 to 2099. A year counts as the title\'s date only when it ends the title (a closing bracket, colon or full stop may follow) or comes right after "in", "for" or the Russian "в"; a year anywhere else is read as the subject. The check fails when such a year is earlier than the current year in the account\'s time zone at the moment the page was fetched, and is skipped when the page has no title.',
		manualCheck: [
			"Open the page and press Ctrl+U to view its source.",
			"Press Ctrl+F, search for <title and read the title up to the separator before the site name.",
			'Check whether it ends with a year or says "in" / "for" a year, and whether that year is already over.',
		],
	},
	TITLE_DUPLICATE: {
		topic: "titles",
		passes: "No other page of the same crawl has this title, ignoring case and punctuation; a translation of the page does not count.",
		fails: "Another crawled page of the site in the same language has the same <title>, ignoring case and punctuation.",
		ifPasses:
			"Each post shows a headline of its own in search results, so searchers can tell the site's pages apart and pick the one that answers them.",
		example: {
			good: "<!-- https://example.com/blog/link-building/ -->\n<title>Link Building for Local Businesses | Example Blog</title>\n<!-- https://example.com/blog/backlink-audit/ -->\n<title>How to Audit Your Backlinks | Example Blog</title>",
			bad: "<!-- https://example.com/blog/link-building/ -->\n<title>Link Building Guide | Example Blog</title>\n<!-- https://example.com/blog/link-building-2/ -->\n<title>link building guide | Example Blog</title>",
			lang: "html",
		},
		howChecked:
			"Within one crawl of a client's site, the tracker compares every page's full title after normalising it: lower case, punctuation and symbols turned into spaces, spaces collapsed. A page fails when another page has the same normalised title, unless the two are language versions of one post — either links to the other with hreflang, or their <html lang> values differ. A page without a title, or a crawl of a single page, is skipped.",
		manualCheck: [
			"Copy the page's title from View source (Ctrl+U, then Ctrl+F for <title).",
			'Search Google for site:example.com "the title in quotes", using the client\'s domain.',
			"Open each other result that shows the same headline and compare its <title> in View source.",
		],
	},
	META_DESCRIPTION_MISSING: {
		topic: "descriptions",
		passes: 'The page has a non-empty <meta name="description">.',
		fails: "There is no meta description, or it is empty.",
		ifPasses:
			"Google has a summary you wrote to show as the snippet when it fits the search. It does not help rankings; it gives searchers your pitch instead of an excerpt out of context.",
		example: {
			good: '<head>\n  <meta name="description" content="Five link-building methods that still work for small sites, what each one costs, and how long it takes to see results.">\n</head>',
			bad: '<head>\n  <meta property="og:description" content="Five link-building methods that still work for small sites.">\n</head>',
			lang: "html",
		},
		howChecked:
			'The tracker reads the content of the first <meta name="description"> in the HTML the server returns (the name is matched in any letter case), with whitespace collapsed. The check fails when there is no such tag or its content is empty. An og:description is quoted in the finding as a ready-made fix, but search results do not read it and it does not count.',
		manualCheck: [
			"Open the page and press Ctrl+U to view its source.",
			'Press Ctrl+F and search for name="description".',
			"Confirm the tag exists and its content attribute holds a real summary, not an empty string.",
		],
	},
	META_DESCRIPTION_LENGTH: {
		topic: "descriptions",
		passes: `The description is ${C.META_DESCRIPTION_LENGTH.min}–${C.META_DESCRIPTION_LENGTH.max} characters long.`,
		fails: `The description is shorter than ${C.META_DESCRIPTION_LENGTH.min} or longer than ${C.META_DESCRIPTION_LENGTH.max} characters.`,
		ifPasses:
			"The summary is long enough to be worth showing and short enough to be shown without being cut mid-sentence on most screens.",
		example: {
			good: '<meta name="description" content="Five link-building methods that still work for small sites, what each one costs, and how long it takes to see results.">',
			bad: '<meta name="description" content="Link building tips.">',
			lang: "html",
		},
		howChecked: `The tracker takes the content of the first <meta name="description"> (whitespace collapsed, ends trimmed) and counts its characters as a reader does. The check fails below ${C.META_DESCRIPTION_LENGTH.min} or above ${C.META_DESCRIPTION_LENGTH.max}; both bounds themselves pass. A page with no description is skipped, because META_DESCRIPTION_MISSING reports it.`,
		manualCheck: [
			"Open the page in Chrome and open DevTools (F12), then the Console.",
			"Run document.querySelectorAll('meta[name=description]')[0].content.trim().length to get the length.",
			`Compare the number with ${C.META_DESCRIPTION_LENGTH.min}–${C.META_DESCRIPTION_LENGTH.max}.`,
		],
	},
	META_DESCRIPTION_REPEATS_TITLE: {
		topic: "descriptions",
		passes: "The description adds something the title does not say.",
		fails: "The description is the same text as the title, ignoring case, punctuation and the site name.",
		ifPasses:
			"The two lines of the search result each tell the searcher something, which gives them a second reason to click and Google less reason to swap the description for a passage of its own.",
		example: {
			good: '<title>How to Build Links | Example Blog</title>\n<meta name="description" content="How to build links that last: five methods and what each costs.">',
			bad: '<title>How to Build Links | Example Blog</title>\n<meta name="description" content="How to build links.">',
			lang: "html",
		},
		howChecked:
			'The tracker lowercases both texts, turns punctuation and symbols into spaces and collapses the spaces, then compares the description with the whole title and with the title cut at the separator before the site name (" | ", " - ", " – " and the like). It fails only on an exact match after that; a description that adds even a few words passes. A page without a title or without a description is skipped.',
		manualCheck: [
			"Open the page and press Ctrl+U to view its source.",
			'Press Ctrl+F for <title, then for name="description".',
			"Read the two side by side: if the description only repeats the title, it fails.",
		],
	},
	META_DESCRIPTION_DUPLICATE: {
		topic: "descriptions",
		passes: "No other page of the same crawl has this description, ignoring case and punctuation; a translation of the page does not count.",
		fails: "Another crawled page of the site in the same language has the same meta description, ignoring case and punctuation.",
		ifPasses:
			"Each page's snippet describes that page, so several results from the site do not read alike and each one gives its own reason to click.",
		example: {
			good: '<!-- https://example.com/blog/link-building/ -->\n<meta name="description" content="Five link-building methods that still work for small sites, and what each one costs.">\n<!-- https://example.com/blog/backlink-audit/ -->\n<meta name="description" content="How to find the backlinks that hurt your site and remove them in an afternoon.">',
			bad: '<!-- https://example.com/blog/link-building/ -->\n<meta name="description" content="Read the latest SEO tips from the Example Blog team.">\n<!-- https://example.com/blog/backlink-audit/ -->\n<meta name="description" content="Read the latest SEO tips from the Example Blog team.">',
			lang: "html",
		},
		howChecked:
			"Within one crawl of a client's site, the tracker compares every page's meta description after normalising it: lower case, punctuation and symbols turned into spaces, spaces collapsed. A page fails when another page has the same normalised description, unless the two are language versions of one post — either links to the other with hreflang, or their <html lang> values differ. A page without a description, or a crawl of a single page, is skipped.",
		manualCheck: [
			'Copy the description from View source (Ctrl+U, then Ctrl+F for name="description").',
			"Open a few other posts of the same site and compare their descriptions the same way.",
			"A theme or SEO plugin that fills in one default description is the usual cause when many posts share it.",
		],
	},
	H1_MISSING: {
		topic: "headings",
		passes: "The page has an <h1> with text in it that is not hidden from readers.",
		fails: "There is no <h1> with text — often the title is styled as a <div> or an <h2>, or the only <h1> is empty or hidden.",
		ifPasses:
			"Readers and screen-reader users land on a clear main heading that confirms they are on the right page, and Google has one more source it reads to understand the page and to build its headline.",
		example: {
			good: "<article>\n  <h1>How to Build Backlinks That Last</h1>\n  <p>Most links a small site earns come from three places.</p>\n</article>",
			bad: '<article>\n  <div class="post-title">How to Build Backlinks That Last</div>\n  <p>Most links a small site earns come from three places.</p>\n</article>',
			lang: "html",
		},
		howChecked:
			'The tracker looks for any <h1> anywhere in <body> of the HTML the server returns, header and sidebar included, and counts it only if it has text. Before reading, it removes what readers do not see: elements marked hidden or aria-hidden="true", screen-reader-only classes such as sr-only and visually-hidden, and buttons inside headings. When no <h1> is left, the finding quotes the first heading of the post\'s content, which is usually the title marked up one level too low.',
		manualCheck: [
			"Open the page and press Ctrl+U to view its source.",
			"Press Ctrl+F and search for <h1.",
			'If there is no match, or the only one is empty or carries hidden, aria-hidden="true" or an sr-only class, the page has no main heading.',
		],
	},
	H1_MULTIPLE: {
		topic: "headings",
		passes: "The page has no more than one <h1>.",
		fails: "The page has two or more <h1> elements.",
		ifPasses:
			"Screen-reader users hear one main topic for the page. The gain is clarity for readers and assistive technology, not rankings — Google copes with several <h1> elements.",
		example: {
			good: '<header>\n  <a class="logo" href="https://example.com/">Example Blog</a>\n</header>\n<article>\n  <h1>How to Build Backlinks That Last</h1>\n  <h2>Why links still matter</h2>\n</article>',
			bad: '<header>\n  <h1 class="logo">Example Blog</h1>\n</header>\n<article>\n  <h1>How to Build Backlinks That Last</h1>\n</article>',
			lang: "html",
		},
		howChecked:
			"The tracker counts every <h1> with text anywhere in <body> of the HTML the server returns — a logo or site name marked up as <h1> in the header counts too. Hidden and screen-reader-only elements are removed first, as for H1_MISSING. The check fails at two or more; a page with none passes here, because H1_MISSING reports that.",
		manualCheck: [
			"Open the page in Chrome and open DevTools (F12), then the Console.",
			"Run document.querySelectorAll('body h1') and look at each element it lists.",
			"Or press Ctrl+U and count the matches of <h1 with Ctrl+F; check the header, logo and sidebar.",
		],
	},
	HEADING_SKIP: {
		topic: "headings",
		passes: "Each heading goes at most one level deeper than the one before it.",
		fails: "The outline jumps a level — for example from <h2> straight to <h4>.",
		ifPasses:
			"The outline reads cleanly for people who move through the page by headings with a screen reader. Google says heading order does not affect ranking, so the gain is accessibility and readability.",
		example: {
			good: "<article>\n  <h1>How to Build Backlinks That Last</h1>\n  <h2>Where links come from</h2>\n  <h3>Guest posts</h3>\n  <h3>Local directories</h3>\n  <h2>What to avoid</h2>\n</article>",
			bad: "<article>\n  <h1>How to Build Backlinks That Last</h1>\n  <h2>Where links come from</h2>\n  <h4>Guest posts</h4>\n</article>",
			lang: "html",
		},
		howChecked:
			"The tracker reads the headings with text of the post's main content only — the <article> holding the <h1>, or <main>, with navigation, headers, footers, sidebars, related-post and comment blocks removed — in page order. Walking pair by pair, it fails at the first heading more than one level deeper than the heading before it; going back up any number of levels is fine. Fewer than two headings is no outline to judge, and the check is skipped.",
		manualCheck: [
			"Open the page in Chrome and open DevTools (F12), then the Console.",
			"Run document.querySelectorAll('article h1, article h2, article h3, article h4, article h5, article h6') (use main instead of article if the post has no <article>).",
			"Read the tags in order and look for a step down of two or more levels, such as H2 followed by H4.",
		],
	},
	NO_SUBHEADINGS: {
		topic: "headings",
		passes: "A long text is broken up by at least one <h2>–<h6>.",
		fails: `The main text runs to ${C.THIN_CONTENT.min} words or more with no heading below the title.`,
		ifPasses:
			"Readers can scan to the section they came for, and screen-reader users can jump between sections. Google has no ideal number of headings, so the gain is for readers, not rankings.",
		example: {
			good: "<article>\n  <h1>How to Build Backlinks That Last</h1>\n  <p>Most links a small site earns come from three places…</p>\n  <h2>Step 1: find pages worth linking to</h2>\n  <p>…</p>\n  <h2>Step 2: write to the right person</h2>\n  <p>…</p>\n</article>",
			bad: "<article>\n  <h1>How to Build Backlinks That Last</h1>\n  <p>Most links a small site earns come from three places…</p>\n  <!-- 1,200 more words of <p> paragraphs and no <h2>–<h6> -->\n</article>",
			lang: "html",
		},
		howChecked: `The tracker counts the words of the post's main content — navigation, headers, footers, sidebars and comments removed — and skips the check below ${C.THIN_CONTENT.min} words, where a short post reads fine as one block. At ${C.THIN_CONTENT.min} words or more it passes as soon as the main content holds any <h2>–<h6> with text, in any order; it fails when the only headings are <h1> or there are none.`,
		manualCheck: [
			"Open the page in Chrome and open DevTools (F12), then the Console.",
			"Run document.querySelectorAll('article h2, article h3, article h4, article h5, article h6').length (use main instead of article if the post has no <article>).",
			`If the result is 0 and the post is ${C.THIN_CONTENT.min} words or longer, it needs subheadings.`,
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
