import type { TGuideCode } from "@Core/Constants/checkTopics";
import type { ICheckCriteria } from "../criteriaShape";

/** Whether Google may crawl, index and quote the page (robots rules), and the links in its text. */
export const INDEXING_AND_LINKS_CRITERIA = {
	// ── Indexing and robots rules ────────────────────────────────────────────────────
	NOINDEX: {
		passes: "No robots meta tag or X-Robots-Tag header tells Google to leave the page out.",
		fails: "A robots/googlebot meta tag or an X-Robots-Tag header says noindex (or none, which includes it), or an unavailable_after date has passed.",
		ifPasses:
			"The page does not ask to be left out of Google's index, so it can be indexed, shown in results and earn search traffic. Passing does not guarantee indexing; it only removes the instruction that would prevent it.",
		example: {
			good: '<meta name="robots" content="index, follow, max-image-preview:large">',
			bad: [
				'<meta name="robots" content="noindex, follow">',
				"<!-- or, in the HTTP response: -->",
				"<!-- X-Robots-Tag: noindex -->",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			'The tracker reads every <meta name="robots"> and <meta name="googlebot"> in the HTML as fetched, and every X-Robots-Tag response header, each on its own — Google combines several tags and headers and applies the most restrictive rule, so a second tag saying noindex counts even after one saying index. It fails the page when any of them holds noindex or none, or an unavailable_after date that was already past when the page was fetched. Header rules prefixed with another crawler\'s name (such as "bingbot: noindex") are ignored, because they do not apply to Google.',
		manualCheck: [
			'Open View source (Ctrl+U), press Ctrl+F and search for "noindex", "none" and "unavailable_after" in the robots and googlebot meta tags.',
			"Run curl -I https://example.com/blog/post/ and look for an X-Robots-Tag line in the response headers.",
			'In Google Search Console, run URL Inspection on the address and check "Indexing allowed?" under Page indexing.',
		],
	},
	SNIPPET_RESTRICTED: {
		passes: "Google may show text from the page under its result and in AI features.",
		fails: "A nosnippet or max-snippet:0 rule is set, or data-nosnippet wraps most of the article.",
		ifPasses:
			"Google may show a text description under the result and may quote the page in AI Overviews, which gives searchers a reason to click.",
		example: {
			good: [
				'<meta name="robots" content="max-snippet:-1, max-image-preview:large">',
				"<p>Plans start at $20. <span data-nosnippet>Coupon: SAVE10</span></p>",
			].join("\n"),
			bad: [
				'<meta name="robots" content="nosnippet">',
				"<!-- or the whole article wrapped: -->",
				"<div data-nosnippet><article>…</article></div>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker reads the same robots and googlebot meta tags and X-Robots-Tag header as the noindex check, and fails the page on nosnippet or max-snippet:0; a positive max-snippet only shortens the text and passes. It also fails the page when a <span>, <div> or <section> with data-nosnippet holds at least half of the words of the main content. data-nosnippet around a smaller passage is treated as an editorial choice and passes.",
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to search for "nosnippet" and "max-snippet".',
			"Run curl -I https://example.com/blog/post/ and check any X-Robots-Tag header for nosnippet or max-snippet:0.",
			"If data-nosnippet is present, see in the Elements panel of Chrome DevTools whether that element wraps the article or only a short passage.",
			"Search Google for site:example.com/blog/post/ and check whether the result shows a description.",
		],
	},
	IMAGE_PREVIEW_NOT_LARGE: {
		passes: "A robots meta tag or header sets max-image-preview:large.",
		fails: "max-image-preview is absent, standard or none — or any declaration restricts it below large.",
		ifPasses:
			"Google may show the page's image at large size, which Discover requires for its large image cards, and which draw more clicks than thumbnails. It is not a ranking signal: it only decides how large the image beside the page may be.",
		example: {
			good: '<meta name="robots" content="index, follow, max-image-preview:large">',
			bad: [
				'<meta name="robots" content="max-image-preview:large">',
				'<meta name="googlebot" content="max-image-preview:standard">',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker reads the robots and googlebot meta tags and the X-Robots-Tag header (rules scoped to other crawlers are ignored). If any of them says max-image-preview:none or max-image-preview:standard, the page fails, even if another one says large, because Google applies the more restrictive rule. Otherwise the page passes only if at least one of them says max-image-preview:large; a page with no robots rules at all fails.",
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to search for "max-image-preview"; check both the robots and the googlebot meta tag.',
			"Run curl -I https://example.com/blog/post/ and check whether an X-Robots-Tag header sets max-image-preview to standard or none.",
		],
	},
	ROBOTS_BLOCKS_GOOGLEBOT: {
		passes: "robots.txt lets Googlebot fetch this URL.",
		fails: "The robots.txt group that applies to Googlebot disallows this URL.",
		ifPasses:
			"Googlebot may fetch and read the page, so its content can be indexed and ranked and its result can carry a description. Whether Google indexes it is then up to the page itself and to Google.",
		example: {
			good: ["User-agent: *", "Disallow: /wp-admin/", "Allow: /wp-admin/admin-ajax.php"].join(
				"\n",
			),
			bad: [
				"# Googlebot obeys only its own group",
				"User-agent: Googlebot",
				"Disallow: /blog/",
				"",
				"User-agent: *",
				"Allow: /",
			].join("\n"),
			lang: "robots",
		},
		howChecked:
			'The tracker reads the site\'s robots.txt once per crawl and asks it about the page\'s final URL for the user-agent "Googlebot": the group that names Googlebot applies, or the "*" group if none does. Lines other than User-agent, Allow and Disallow — Sitemap, Crawl-delay or unknown ones — are ignored, as Google ignores them, so they never split a group. Within the group the longest matching Allow or Disallow rule wins, and Allow wins a tie; the finding quotes the deciding line. A missing robots.txt (a 4xx answer) allows everything. The check is not applicable when the page is on a host or scheme that robots.txt does not cover.',
		manualCheck: [
			"Open https://example.com/robots.txt in the browser and find the User-agent: Googlebot group, or the User-agent: * group if there is none.",
			"Compare its Disallow and Allow lines with the page's path; the longest matching rule decides.",
			'In Google Search Console, run URL Inspection on the page and check "Crawl allowed?", and open the robots.txt report to see the version Google last fetched.',
		],
	},
	ROBOTS_BLOCKS_RESOURCES: {
		passes: "Googlebot may fetch every script and stylesheet the page loads from the site.",
		fails: "robots.txt forbids Googlebot a script or stylesheet the page needs to render.",
		ifPasses:
			"Google renders the page with the same styles and scripts a reader's browser gets, so it sees the layout and any content scripts add, and can judge the page fit for phones.",
		example: {
			good: ["User-agent: *", "Disallow: /wp-admin/"].join("\n"),
			bad: [
				"# the page loads /wp-includes/js/jquery/jquery.min.js",
				"User-agent: *",
				"Disallow: /wp-includes/",
				"Disallow: /wp-content/themes/",
			].join("\n"),
			lang: "robots",
		},
		howChecked:
			"The tracker collects every <script src> and <link rel=\"stylesheet\"> in the page's HTML and asks the site's robots.txt whether Googlebot may fetch each one. Only files on the host and scheme that robots.txt covers are judged; files on a CDN or another domain, and Cloudflare's own /cdn-cgi/ files, are skipped. Images are not judged. The page fails if any judged file is disallowed, and the check is not applicable when no file is left to judge.",
		manualCheck: [
			"Open Chrome DevTools, go to the Network panel, filter by JS and CSS and reload; note the files served from the site's own domain.",
			"Open https://example.com/robots.txt and check whether a Disallow rule for Googlebot (or *) matches any of those paths.",
			"In Google Search Console, run URL Inspection, choose Test live URL, then View tested page and More info to see the page resources Google could not load.",
		],
	},
	ROBOTS_BLOCKS_AI_SEARCH: {
		passes: "OAI-SearchBot, PerplexityBot, Claude-SearchBot and Bingbot may all fetch the page.",
		fails: "robots.txt blocks one or more of those AI-search crawlers. Training crawlers (GPTBot, ClaudeBot, Google-Extended) are not judged.",
		ifPasses:
			"ChatGPT search, Perplexity, Claude's search and Bing (and Copilot, which answers from Bing) may fetch the page, so they can show and cite it in their answers. It has no effect on Google Search.",
		example: {
			good: [
				"# training crawlers may be blocked; this still passes",
				"User-agent: GPTBot",
				"User-agent: ClaudeBot",
				"Disallow: /",
				"",
				"User-agent: *",
				"Allow: /",
			].join("\n"),
			bad: ["User-agent: OAI-SearchBot", "User-agent: PerplexityBot", "Disallow: /"].join(
				"\n",
			),
			lang: "robots",
		},
		howChecked:
			"The tracker asks the site's robots.txt about the page's final URL four times, as OAI-SearchBot, PerplexityBot, Claude-SearchBot and bingbot; each one obeys the group that names it, or the \"*\" group if none does. The page fails if any of the four is disallowed, and the finding names which. GPTBot, ClaudeBot, Google-Extended and other training crawlers are never asked. The check is not applicable when robots.txt does not cover the page's host or scheme.",
		manualCheck: [
			"Open https://example.com/robots.txt in the browser.",
			'Use Ctrl+F to search for "OAI-SearchBot", "PerplexityBot", "Claude-SearchBot" and "bingbot"; for each one not named, the User-agent: * group applies.',
			"Check whether the group that applies to each has a Disallow rule matching the page's path.",
		],
	},

	// ── Links ────────────────────────────────────────────────────────────────────────
	NO_INTERNAL_LINKS: {
		passes: "The article's own text links to at least one other page of the site.",
		fails: "The text links nowhere on the site. Navigation, footer, related-post rails and table-of-contents links do not count.",
		ifPasses:
			"Crawlers can discover the linked pages through the article and read the anchor words as a description of them, and readers get an obvious next page to go to.",
		example: {
			good: [
				"<article>",
				"  <h1>How to plan a content calendar</h1>",
				'  <p>Start from your <a href="/blog/keyword-research/">keyword research</a>.</p>',
				"</article>",
			].join("\n"),
			bad: [
				"<article>",
				'  <p><a href="#step-2">Skip to step 2</a></p>',
				'  <p>See <a href="https://other-site.com/guide/">this guide</a>.</p>',
				"</article>",
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"The tracker reads the links (<a href>) in the page's main content only: <main> or the article, with nav, header, footer, aside, forms and blocks whose class names say related, sidebar, widget, share, social, breadcrumb, comment and the like removed. A link is internal when its host matches the page's, ignoring a leading www.; any other subdomain counts as another site. Links back to the page itself, such as table-of-contents anchors, do not count. The page passes with at least one link to another page of the site.",
		manualCheck: [
			"Open the post, press F12 and in the Console run [...document.querySelectorAll('article a[href]')].map(a => a.href) (use main instead of article if the theme has no <article>).",
			"Check that at least one address is on the site's own domain and is not the post itself or a #heading anchor on it.",
			"Ignore links in the menu, sidebar, footer and related-posts block; only links in the text count.",
		],
	},
	INTERNAL_LINKS_NOFOLLOW: {
		passes: 'Links to the site\'s own pages carry no rel="nofollow".',
		fails: 'One or more links to the site\'s own pages are marked rel="nofollow".',
		ifPasses:
			"Links to your own pages pass on what they say about those pages: Google may crawl them from here and use their anchor text as a description. The effect of each link is small.",
		example: {
			good: [
				'<a href="/blog/seo-audit/">SEO audit checklist</a>',
				"<!-- an affiliate redirect may keep nofollow -->",
				'<a href="/go/hosting/" rel="nofollow sponsored">our host</a>',
			].join("\n"),
			bad: '<a href="/blog/seo-audit/" rel="nofollow">SEO audit checklist</a>',
			lang: "html",
		},
		howChecked:
			'The tracker looks at the internal links in the main content (same site, not the page itself) and fails the page if any of them has "nofollow" among its rel values. Links whose first path segment is an affiliate-style redirect folder (/go/, /out/, /refer/, /recommends/, /visit/, /goto/, /aff/, /affiliate/) and links to print versions (a path segment containing "print") are left out. The check is not applicable when the content has no internal links.',
		manualCheck: [
			"In the Chrome DevTools Console, run document.querySelectorAll('article a[rel~=\"nofollow\"]') on the post.",
			"For each result, check whether its href points to the site's own domain; links to other sites may keep nofollow.",
			'Alternatively open View source (Ctrl+U) and use Ctrl+F to search for "nofollow".',
		],
	},
	INTERNAL_LINK_VARIANTS: {
		passes: "Internal links use the same scheme and host the page is served at, with no tracking parameters.",
		fails: "Internal links go through http://, the other www variant, or URLs with tracking or session parameters.",
		ifPasses:
			"Each internal link goes straight to the address the site serves, with no redirect hop and no duplicate URL for Google to crawl and match back to the real page.",
		example: {
			good: [
				"<!-- page served at https://www.example.com/blog/post/ -->",
				'<a href="https://www.example.com/blog/seo-audit/">SEO audit</a>',
				'<a href="/blog/seo-audit/">SEO audit</a>',
			].join("\n"),
			bad: [
				'<a href="http://www.example.com/blog/seo-audit/">SEO audit</a>',
				'<a href="https://example.com/blog/seo-audit/">SEO audit</a>',
				'<a href="/blog/seo-audit/?utm_source=newsletter">SEO audit</a>',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"For each internal link in the main content, the tracker compares the resolved address with the page's own final URL. It flags plain http:// on an HTTPS page, a host that differs only by www., and query parameters that only identify a visit (utm_*, gclid, fbclid, msclkid, _ga, _gl, sessionid, PHPSESSID, JSESSIONID and a few more). Trailing slashes are not judged, links the crawl found dead are left to the broken-links check, and the check is not applicable without internal links.",
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to search for "http://", "utm_" and the other www form of the domain.',
			"Or in the Chrome DevTools Console run [...document.querySelectorAll('article a[href]')].map(a => a.href) and compare each internal address with the one in the address bar.",
		],
	},
	BROKEN_LINKS: {
		passes: "Every content link that was checked leads to a working page.",
		fails: "A link to this site answers 4xx (other than 401, 402, 403 or 429) or 5xx, or loops, or a link to another site answers 404/410 or its domain does not exist. Anti-bot answers (401, 403, 429, 5xx, timeouts) from other sites are never counted.",
		ifPasses:
			"Readers who follow a link reach a working page, and each source still backs the claim it was linked for. The gain is for readers: a dead link costs the reader, not this page's ranking.",
		example: {
			good: ["GET https://example.com/blog/keyword-research/", "HTTP/1.1 200 OK"].join("\n"),
			bad: ["GET https://example.com/blog/old-guide/", "HTTP/1.1 404 Not Found"].join("\n"),
			lang: "http",
		},
		howChecked:
			"During the crawl the tracker requests each distinct link in the main content (without its #fragment, skipping the page itself and /cdn-cgi/ addresses), following up to 5 redirects. A link to this site is broken on any 4xx or 5xx except 401, 402, 403 and 429, or on too many redirects; a link to another site only on 404, 410 or a domain that does not exist. An answer reached through a detour to a third host, such as a consent page, is never counted. The crawl checks at most 300 distinct link URLs in sitemap order, 2 at a time per host, 5 s per request and 60 s in all, and skips links the host's robots.txt closes to it; the finding says how many links it could check.",
		manualCheck: [
			"List the post's links in the Chrome DevTools Console with [...document.querySelectorAll('article a[href]')].map(a => a.href).",
			"Run curl -I on each one; if it answers 301 or 302, run it again on the Location address.",
			"Treat 404 and 410 as dead; a 403 or 429 to curl from another site usually means a bot block, so open that link in the browser instead.",
			"For links within the site, Google Search Console's Page indexing report lists addresses Google found answering Not found (404).",
		],
	},
	LINKS_TO_REDIRECTS: {
		passes: "Links to this site point straight at the final address.",
		fails: "A content link to this site answers with a permanent redirect (301 or 308) before reaching the page.",
		ifPasses:
			"Readers and crawlers reach each linked page in one request, and every internal link names the address the site prefers, a consistent hint about which URL is canonical.",
		example: {
			good: [
				'<!-- <a href="/blog/new-guide/"> -->',
				"GET https://example.com/blog/new-guide/",
				"HTTP/1.1 200 OK",
			].join("\n"),
			bad: [
				'<!-- <a href="/blog/old-guide/"> -->',
				"GET https://example.com/blog/old-guide/",
				"HTTP/1.1 301 Moved Permanently",
				"Location: https://example.com/blog/new-guide/",
			].join("\n"),
			lang: "http",
		},
		howChecked:
			"The tracker uses the same link requests as the broken-links check, but judges only links to this site that are not http://, other-www or tracking-tagged variants (those are reported as variants). A link fails when its first hop is a permanent redirect (301 or 308) and it ended on a 2xx page; one that ended on an error is a broken link instead. A temporary redirect (302, 303, 307) passes: Google keeps showing the source URL for one, so the link already names the address to use. Affiliate redirects under /out/, /go/, /refer/ and the like, and actions such as /cart, /checkout, add-to-cart or sign-in links, are left out, because redirecting is what they are for. Because trailing slashes are not a variant, a link to /post that redirects to /post/ counts here. Links to other sites are not judged, and the check is not applicable when no internal link got an answer.",
		manualCheck: [
			"List the post's internal links in the Chrome DevTools Console with [...document.querySelectorAll('article a[href]')].map(a => a.href).",
			"Run curl -I on each; a 301, 302, 307 or 308 with a Location header means the link redirects.",
			"Update the link to the Location address, including any trailing slash.",
		],
	},
	LINKS_WITHOUT_TEXT: {
		passes: "Every content link to this site has text, a title, an image with alt, an aria-label or screen-reader text.",
		fails: "A content link to this site has no text at all — an icon or an image without alt. Links to other sites are not judged.",
		ifPasses:
			'Google can read each link\'s words as a description of the page it points to, and screen readers announce where each link goes instead of just "link".',
		example: {
			good: [
				'<a href="/blog/seo-audit/">SEO audit checklist</a>',
				'<a href="/blog/seo-audit/"><img src="/img/audit.png" alt="SEO audit checklist"></a>',
				'<a href="/contact/" aria-label="Contact us"><i class="icon-mail"></i></a>',
			].join("\n"),
			bad: [
				'<a href="/blog/seo-audit/"><img src="/img/audit.png"></a>',
				'<a href="/contact/"><i class="icon-mail"></i></a>',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			"For each link in the main content, the tracker works out the name a screen reader would announce: aria-labelledby, then aria-label, then the link's text — in which an element with a name of its own is read by it: an icon's aria-label, an image's alt or title, an <svg>'s <title>, an image button's alt — then the title attribute. Visually hidden screen-reader text (such as .sr-only or .screen-reader-text) counts; anything marked aria-hidden=\"true\" does not. The page fails if a link to this site has an empty name; links to other sites, such as icon-only share buttons, are left out.",
		manualCheck: [
			'In Chrome DevTools run Lighthouse with the Accessibility category and look for "Links do not have a discernible name".',
			"Or in the Console run [...document.querySelectorAll('article a[href]')].filter(a => !a.innerText.trim() && !a.getAttribute('aria-label') && !a.title && !a.querySelector('img[alt]:not([alt=\"\"])')).",
			"Check that each link found points to the site's own domain; links to other sites are not judged.",
		],
	},
	UNCRAWLABLE_LINKS: {
		passes: "Every link that leads to a page is an <a> whose href is a real web address.",
		fails: 'A link navigates by onclick with no href, by a javascript: href, or by a "#/route" fragment.',
		ifPasses:
			"Google can follow every link in the text to the page it leads to, discovering that page and reading the anchor text as its description, while the links still work for readers.",
		example: {
			good: [
				'<a href="/pricing/">Pricing</a>',
				'<a href="/pricing/" onclick="track(\'pricing\')">Pricing</a>',
			].join("\n"),
			bad: [
				"<a onclick=\"location.href='/pricing/'\">Pricing</a>",
				"<a href=\"javascript:goTo('/pricing/')\">Pricing</a>",
				'<a href="#/pricing">Pricing</a>',
			].join("\n"),
			lang: "html",
		},
		howChecked:
			'The tracker looks at every <a> in the main content of the HTML as fetched. It flags an <a> without href whose onclick names a destination (location, href, window.open, navigate or a quoted path or URL), an href that is a javascript: call, and an href with a "#/" or "#!" route on this site, such as #/pricing. Controls are left alone: role="button", javascript:void(0) and similar do-nothing scripts, a bare "#!" or "#/" that names no route, <a name> anchors, and Ghost\'s #/portal links.',
		manualCheck: [
			'Open View source (Ctrl+U) and use Ctrl+F to search for "javascript:", "onclick", "#/" and "#!" inside the article.',
			'Or in the Chrome DevTools Console run document.querySelectorAll(\'article a:not([href]), article a[href^="javascript:"], article a[href^="#/"], article a[href^="#!"]\').',
			"For each result, check whether it is meant to open a page; if so it needs a real address in href.",
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
