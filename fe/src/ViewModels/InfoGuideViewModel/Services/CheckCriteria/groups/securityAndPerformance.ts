import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import { thousands, type ICheckCriteria, type TGuideCode } from "../checkTopics";

const C = SEO_ISSUE_CATALOGUE;

/** HTTPS and redirects, then the speed risks the tracker reads from a page's HTML and headers. */
export const SECURITY_AND_PERFORMANCE_CRITERIA = {
	// ── HTTPS and redirects ──────────────────────────────────────────────────────────
	NOT_HTTPS: {
		topic: "security",
		passes: "The page is served over HTTPS.",
		fails: "The page is served over plain HTTP.",
		ifPasses:
			'Readers see the page as secure, with no "Not secure" label, and nothing they read or send can be read or altered on the way. HTTPS also counts as a ranking signal, though a very light one.',
		example: {
			good: "$ curl -I https://www.example.com/blog/seo-guide/\nHTTP/2 200\ncontent-type: text/html; charset=utf-8",
			bad: "$ curl -I http://www.example.com/blog/seo-guide/\nHTTP/1.1 200 OK\ncontent-type: text/html; charset=utf-8",
			lang: "http",
		},
		howChecked:
			"The crawler requests the post and follows any redirects itself, up to five, then looks at the address that finally answered. If that address starts with http: the check fails; if it starts with https: it passes. So an http address that redirects to https passes here — the redirect is reported by REDIRECTED instead.",
		manualCheck: [
			'Open the post and look at the address bar: it should start with https:// and show no "Not secure" label.',
			"Run curl -I https://… on the post's address and confirm it answers 200 at that https address.",
			"Run curl -I on the same address with http:// and check it answers 301 or 308 with a location: https://… line.",
		],
	},
	MIXED_CONTENT: {
		topic: "security",
		passes: "An HTTPS page loads every resource over HTTPS.",
		fails: "An HTTPS page loads some scripts, styles, frames or images over plain HTTP.",
		ifPasses:
			"The padlock stays in the address bar, and every script, stylesheet, frame and image reaches readers and Google's renderer instead of being blocked or flagged by the browser.",
		example: {
			good: '<link rel="stylesheet" href="https://www.example.com/css/site.css">\n<script src="https://cdn.example.com/app.js" defer></script>\n<img src="/uploads/traffic-chart.png" alt="Traffic by month">',
			bad: '<link rel="stylesheet" href="http://www.example.com/css/site.css">\n<img src="http://cdn.example.com/uploads/traffic-chart.png" alt="Traffic by month">',
			lang: "html",
		},
		howChecked:
			"Only a page whose final address is https: is judged; on an http page the check is not applicable. The tracker collects the addresses in <img> src, srcset and data-src, <source> srcset and src, <script src>, stylesheet <link>s, <iframe>, <frame> and <embed> src, <video>, <audio> and <track> src, and <object> data, resolving relative ones against the page (or its <base href>). Any that resolves to an http: address fails the check, and the finding lists them. Files that scripts or stylesheets load later are not seen, and ordinary <a> links do not count.",
		manualCheck: [
			'Open the post over https, open Chrome DevTools\' Console and look for "Mixed Content" warnings.',
			'In the Console, run document.querySelectorAll(\'[src^="http:"], [srcset*="http:"], link[rel=stylesheet][href^="http:"], object[data^="http:"]\') — an empty list passes.',
			'Or open View source (Ctrl+U) and search (Ctrl+F) for "http: to find addresses written without https.',
		],
	},
	REDIRECTED: {
		topic: "security",
		passes: "The sitemap URL answers directly, without redirecting.",
		fails: "The URL the sitemap lists redirects to another address.",
		ifPasses:
			"Readers and crawlers reach the post in one request instead of two, and the address the sitemap lists is the one that can appear in results.",
		example: {
			good: "$ curl -I https://www.example.com/blog/seo-guide/\nHTTP/2 200\ncontent-type: text/html; charset=utf-8",
			bad: "$ curl -I https://www.example.com/blog/seo-guide\nHTTP/2 301\nlocation: https://www.example.com/blog/seo-guide/",
			lang: "http",
		},
		howChecked:
			"The crawler requests the address it was given — the sitemap's entry, or the feed's or blog index's link when the site has no usable sitemap — and follows redirects itself, one hop at a time: any 3xx status except 304 that carries a Location header, up to five. If the address that finally answered is not the one requested, the check fails and the finding lists every hop with its status, flagging 302, 303 and 307 as temporary. An address that answers directly passes.",
		manualCheck: [
			"Copy the post's address exactly as the sitemap lists it and run curl -I https://… on it: the status should be 200, not 301, 302, 307 or 308.",
			"If it redirects, run curl -I on the location address, and repeat until one answers 200 — that final address is the one the sitemap should list.",
			"Or open Chrome DevTools' Network panel with Preserve log ticked, load the sitemap's address, and look for 3xx rows before the page itself.",
		],
	},
	META_REFRESH: {
		topic: "security",
		passes: "The page does not move readers on with a meta refresh.",
		fails: 'The page contains <meta http-equiv="refresh"> pointing elsewhere.',
		ifPasses:
			"Readers stay on the page they opened without a flash of it first, and a page that has really moved can say so with a server-side redirect, which Google reads most reliably.",
		example: {
			good: '<head>\n  <meta charset="utf-8">\n  <title>The SEO guide</title>\n  <link rel="canonical" href="https://www.example.com/blog/seo-guide/">\n</head>',
			bad: '<head>\n  <meta charset="utf-8">\n  <meta http-equiv="refresh" content="0; url=https://www.example.com/blog/seo-guide-2026/">\n</head>',
			lang: "html",
		},
		howChecked:
			'The tracker reads the first <meta http-equiv="refresh"> anywhere in the HTML (http-equiv in any letter case) and looks in its content for a url= part. With a target, such as content="0; url=/new-post/", the check fails whatever the delay, and the finding quotes the tag. A refresh without a target (content="30"), which only reloads the same page, passes, as does a page without the tag. A Refresh response header is not read.',
		manualCheck: [
			"Open View source (Ctrl+U) and search (Ctrl+F) for http-equiv.",
			"If a refresh tag is there, check whether its content holds url= — that part makes it a redirect.",
			"Or in Chrome DevTools' Console, run document.querySelectorAll('meta[http-equiv=refresh i]') — an empty list passes.",
		],
	},

	// ── Speed risks in the HTML ──────────────────────────────────────────────────────
	LARGE_PAGE: {
		topic: "performance",
		passes: `The HTML is at most ${thousands(C.LARGE_PAGE.max)} bytes (1 MB) — half of what Googlebot reads.`,
		fails: `The HTML is over ${thousands(C.LARGE_PAGE.max)} bytes.`,
		ifPasses:
			"The whole post sits well inside the part of the file Googlebot reads, and the HTML downloads and parses faster on a phone connection.",
		example: {
			good: "$ curl -s https://www.example.com/blog/seo-guide/ | wc -c\n184320",
			bad: "$ curl -s https://www.example.com/blog/annual-report/ | wc -c\n1530880",
			lang: "text",
		},
		howChecked: `The crawler counts the bytes of the page's HTML after undoing any gzip, deflate or Brotli compression — the size of the file itself, not of what travelled over the wire. Over ${thousands(C.LARGE_PAGE.max)} bytes fails. Only the HTML is counted: the images, scripts and stylesheets it loads are not.`,
		manualCheck: [
			`Run curl -s https://… | wc -c on the post: the number is its HTML size in bytes, and over ${thousands(C.LARGE_PAGE.max)} fails.`,
			"If it is large, open View source (Ctrl+U) and search (Ctrl+F) for base64, <svg or a long <script> block of page data — the usual causes.",
		],
	},
	LCP_IMAGE_LAZY_LOADED: {
		topic: "performance",
		passes: "The featured image at the top of the post loads eagerly.",
		fails: 'The featured image at the top of the post is marked loading="lazy".',
		ifPasses:
			"The browser requests the main image as soon as it reads the tag, instead of waiting for layout, so the top of the post can finish drawing sooner.",
		example: {
			good: '<meta property="og:image" content="https://www.example.com/uploads/seo-guide.jpg">\n<!-- in <body>, under the headline -->\n<h1>The SEO guide</h1>\n<img src="https://www.example.com/uploads/seo-guide-1200x630.jpg"\n     width="1200" height="630" fetchpriority="high" alt="A search results page">',
			bad: '<meta property="og:image" content="https://www.example.com/uploads/seo-guide.jpg">\n<!-- in <body>, under the headline -->\n<h1>The SEO guide</h1>\n<img src="https://www.example.com/uploads/seo-guide-1200x630.jpg"\n     width="1200" height="630" loading="lazy" alt="A search results page">',
			lang: "html",
		},
		howChecked:
			'The tracker takes the image og:image names and finds the first <img> in the body whose src or srcset shows the same file — matched by file name, ignoring the folder, the extension and a size suffix such as -1200x630 — skipping copies declared narrower than 200 pixels. That image counts as at the top when at most 60 words of paragraph text sit between the <h1> and it. If it has loading="lazy" the check fails; any other value, or none, passes. With no og:image, or with that image further down or missing from the page, the check is not applicable.',
		manualCheck: [
			"Open View source (Ctrl+U), search (Ctrl+F) for og:image and note the image's file name.",
			'Search for that file name again to find the <img> under the headline, and check it has no loading="lazy".',
			"Or run PageSpeed Insights (https://pagespeed.web.dev) on the post: its Largest Contentful Paint diagnostics name the LCP element and say whether it was lazy-loaded.",
		],
	},
	RENDER_BLOCKING_SCRIPTS: {
		topic: "performance",
		passes: "Every external script in <head> is async, defer, a module, or not JavaScript at all.",
		fails: "One or more external classic scripts in <head> — not modules — have neither async nor defer.",
		ifPasses:
			"The browser keeps reading and drawing the page while the scripts download, so the first view appears sooner.",
		example: {
			good: '<head>\n  <script src="https://www.example.com/js/app.js" defer></script>\n  <script src="https://analytics.example.com/tag.js" async></script>\n  <script type="module" src="/js/widgets.js"></script>\n</head>',
			bad: '<head>\n  <script src="https://www.example.com/js/jquery.min.js"></script>\n</head>',
			lang: "html",
		},
		howChecked:
			'The tracker reads every <script src> the HTML parser places in <head> and counts it as blocking when it is classic JavaScript — no type, or text/javascript, application/javascript, text/ecmascript or application/ecmascript — with neither async nor defer. type="module" scripts, which defer by themselves, and data types such as JSON pass. Inline scripts and scripts in <body> are not judged. Any blocking script fails the check, and the finding quotes each one.',
		manualCheck: [
			"In Chrome DevTools' Console, run document.querySelectorAll('head script[src]:not([async]):not([defer]):not([type=module])') — an empty list passes.",
			'Or open View source (Ctrl+U) and look at each <script src> before </head> for async, defer or type="module".',
			"Run Lighthouse in Chrome DevTools to see how long each render-blocking script holds up the first paint.",
		],
	},
	FONT_PRELOAD_WITHOUT_CROSSORIGIN: {
		topic: "performance",
		passes: "Every font preload carries the crossorigin attribute.",
		fails: 'A <link rel="preload" as="font"> has no crossorigin, so the font downloads twice.',
		ifPasses:
			"The font downloads once and the preloaded copy is the one the text uses, so text shows in its own font sooner.",
		example: {
			good: '<link rel="preload" as="font" type="font/woff2"\n      href="/fonts/inter-var.woff2" crossorigin>',
			bad: '<link rel="preload" as="font" type="font/woff2"\n      href="/fonts/inter-var.woff2">',
			lang: "html",
		},
		howChecked:
			"The tracker finds every <link> whose rel includes preload and whose as is font (in any letter case), anywhere in the HTML, and fails the check for each one without a crossorigin attribute, quoting it. Any crossorigin counts, even an empty one, and a font on the same host needs it too. A page with no font preload passes.",
		manualCheck: [
			"In Chrome DevTools' Console, run document.querySelectorAll('link[rel~=preload][as=font]:not([crossorigin])') — an empty list passes.",
			'Reload with the Console open: Chrome warns that a preload "is not used because the request credentials mode does not match".',
			"In the Network panel, filter by Font and check each font file is requested only once.",
		],
	},
	BFCACHE_BLOCKED_BY_NO_STORE: {
		topic: "performance",
		passes: "The page is not served with Cache-Control: no-store.",
		fails: "The page is served with Cache-Control: no-store, so Back reloads it instead of restoring it.",
		ifPasses:
			"Browsers can keep the page in the back/forward cache, so a reader who taps Back returns to it instantly instead of waiting for it to load again.",
		example: {
			good: "$ curl -I https://www.example.com/blog/seo-guide/\nHTTP/2 200\ncontent-type: text/html; charset=utf-8\ncache-control: public, max-age=600",
			bad: "$ curl -I https://www.example.com/blog/seo-guide/\nHTTP/2 200\ncontent-type: text/html; charset=utf-8\ncache-control: private, no-store, max-age=0",
			lang: "http",
		},
		howChecked:
			"The tracker reads the Cache-Control header of the response that finally served the page and fails the check when it holds the no-store directive, in any letter case and position. no-cache, private and max-age do not fail it. No browser is run, so other things that keep a page out of the back/forward cache are not seen.",
		manualCheck: [
			"Run curl -I https://… on the post and read the cache-control line: no-store fails.",
			"In Chrome DevTools, open the Application panel, choose Back/forward cache and click Test back/forward cache — it lists every reason the page cannot be restored.",
		],
	},
	DOM_SIZE_LARGE: {
		topic: "performance",
		passes: `The HTML holds at most ${thousands(C.DOM_SIZE_LARGE.max)} elements.`,
		fails: `The HTML holds more than ${thousands(C.DOM_SIZE_LARGE.max)} elements.`,
		ifPasses:
			"Each tap, scroll and layout has fewer elements to recalculate, so the page responds faster and uses less memory on phones.",
		example: {
			good: `> document.querySelectorAll("*").length\n1186   (${thousands(C.DOM_SIZE_LARGE.max)} or fewer passes)`,
			bad: `> document.querySelectorAll("*").length\n2487   (more than ${thousands(C.DOM_SIZE_LARGE.max)} fails)`,
			lang: "text",
		},
		howChecked: `The tracker parses the HTML as the server sent it and counts every element in it, <html>, <head> and everything in it included. More than ${thousands(C.DOM_SIZE_LARGE.max)} fails — Lighthouse's line for an excessive DOM. Elements that scripts add after the page loads are not counted.`,
		manualCheck: [
			"Open the post, open Chrome DevTools' Console and run document.querySelectorAll('*').length — this counts what scripts added as well, so it may read higher than the tracker.",
			"Run Lighthouse in Chrome DevTools, or PageSpeed Insights (https://pagespeed.web.dev), and read its DOM size diagnostic for the total, the deepest nesting and the element with the most children.",
		],
	},
	HTML_NOT_COMPRESSED: {
		topic: "performance",
		passes: "Asked for gzip, deflate or br, the server answers compressed.",
		fails: "The server answers the HTML uncompressed although compression was offered.",
		ifPasses:
			"The HTML travels typically several times smaller, so it arrives sooner on slow connections and every crawl of the site costs the server less.",
		example: {
			good: '$ curl -s -H "Accept-Encoding: gzip, br" -I https://www.example.com/blog/seo-guide/\nHTTP/2 200\ncontent-type: text/html; charset=utf-8\ncontent-encoding: br',
			bad: '$ curl -s -H "Accept-Encoding: gzip, br" -I https://www.example.com/blog/seo-guide/\nHTTP/2 200\ncontent-type: text/html; charset=utf-8',
			lang: "http",
		},
		howChecked:
			"The crawler asks for every page with Accept-Encoding: gzip, deflate, br, as Google's crawlers do, and reads the Content-Encoding header of the response that finally served the page. gzip, x-gzip, deflate, br or zstd passes; no Content-Encoding, identity or any other value fails.",
		manualCheck: [
			'Run curl -s -H "Accept-Encoding: gzip, br" -I https://… on the post and look for a content-encoding line saying gzip or br.',
			"Or open Chrome DevTools' Network panel, reload, click the page's own request and check Response Headers for content-encoding.",
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
