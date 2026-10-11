import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import { thousands, type ICheckCriteria, type TGuideCode } from "../checkTopics";

const C = SEO_ISSUE_CATALOGUE;

/** Images and video, the page's language, mobile layout and encoding, and its share preview. */
export const MEDIA_LANGUAGE_SHARING_CRITERIA = {
	// ── Images and video ─────────────────────────────────────────────────────────────
	IMAGES_MISSING_ALT: {
		topic: "media",
		passes: 'Every image has an alt attribute (alt="" is right for decorative images).',
		fails: "One or more images have no alt attribute at all.",
		ifPasses:
			"Screen readers can describe every image, a broken image still says what it was, and Google has the text it reads first to understand each image for image search.",
		example: {
			good: '<img src="/img/keyword-map.png" alt="Keyword map grouping 40 queries into 6 topics">\n<img src="/img/divider.svg" alt="">',
			bad: '<img src="/img/keyword-map.png">',
			lang: "html",
		},
		howChecked:
			'The crawler collects the <img> elements of the article\'s main content. An image whose alt attribute is absent fails; an empty alt="" passes, because it correctly marks a decorative image. A page with no images is not judged.',
		manualCheck: [
			'Open DevTools → Console and run: document.querySelectorAll("main img:not([alt]), article img:not([alt])").length',
			"Or press Ctrl+U and search for <img to read each tag's alt attribute.",
			"Check that each alt describes what the image shows, not just a keyword.",
		],
	},
	NO_IMAGES: {
		topic: "media",
		passes: "A long text has an image, a frame, a video or a featured image.",
		fails: `The main text runs to ${C.THIN_CONTENT.min} words or more with no image, video or featured image.`,
		ifPasses:
			"A long post is easier to read, and has a chance to be found through image search as well as web search.",
		example: {
			good: '<article>\n  <h1>Local SEO checklist</h1>\n  <img src="/img/local-pack.png" alt="Map pack with three local results">\n  <p>…1,200 words…</p>\n</article>',
			bad: "<article>\n  <h1>Local SEO checklist</h1>\n  <p>…1,200 words of text and no image, video or embed…</p>\n</article>",
			lang: "html",
		},
		howChecked: `Only posts whose main content has at least ${C.THIN_CONTENT.min} words are judged. The post passes if its main content holds an <img>, or a frame, video or plugin object (a YouTube player, a CodePen demo), or if the page shows a featured image at the top. Images drawn by CSS or inline SVG are not seen.`,
		manualCheck: [
			"Open the post and scroll through it: is there any image, chart, video or embed in the article itself?",
			'In DevTools → Console run: document.querySelectorAll("article img, article iframe, article video").length',
		],
	},
	IMAGES_NOT_INDEXABLE: {
		topic: "media",
		passes: "Every <img> has a src (a srcset beside it is fine).",
		fails: "An <img> has a srcset and no src, so crawlers may not find the image.",
		ifPasses:
			"Google finds the image in the src attribute, as its image guidance asks, so the image can appear in image search; browsers that ignore srcset still show it.",
		example: {
			good: '<img src="/img/chart-800.png"\n     srcset="/img/chart-400.png 400w, /img/chart-800.png 800w"\n     sizes="(max-width: 600px) 400px, 800px" alt="Traffic chart">',
			bad: '<img srcset="/img/chart-400.png 400w, /img/chart-800.png 800w" alt="Traffic chart">',
			lang: "html",
		},
		howChecked:
			"For every <img> in the main content, the check looks for an empty or missing src next to a srcset. Each such image is quoted in the finding. Images set later by a lazy-loading script from data-src are not reported, because Google renders the page and sees what the script sets.",
		manualCheck: [
			'In DevTools → Console run: [...document.querySelectorAll("img[srcset]")].filter(i => !i.getAttribute("src")).length',
			"Or press Ctrl+U and look for <img tags that have srcset but no src.",
		],
	},
	IMAGE_FILENAMES_GENERIC: {
		topic: "media",
		passes: "Image files have names a person chose, or names a CDN generated.",
		fails: "Image files keep a camera or placeholder name — IMG_1234, DSC01234, Screenshot 2026-…, image1, untitled.",
		ifPasses:
			"The file name gives Google one more light clue about what the image shows, as its image guidance suggests.",
		example: {
			good: '<img src="/uploads/local-seo-map-pack.jpg" alt="Map pack with three local results">',
			bad: '<img src="/uploads/IMG_4821.jpg" alt="Map pack with three local results">\n<img src="/uploads/Screenshot-2026-03-04-at-10.12.33.png" alt="…">',
			lang: "html",
		},
		howChecked:
			"The check takes the file name of each image's URL, drops the extension and WordPress size suffixes such as -1024x768, and matches it against two patterns: names cameras, phones and tools give by default (IMG_1234, DSC…, PXL…, GOPR…, WhatsApp Image…, Screenshot…) and placeholders (image, img1, photo, untitled, unnamed, download, file). Hashed names a CDN generates are not reported. A page with no named images is not judged.",
		manualCheck: [
			"Press Ctrl+U and search for <img; read the file name at the end of each src.",
			'In DevTools → Console run: [...document.images].map(i => i.src.split("/").pop())',
		],
	},
	VIDEO_WITHOUT_METADATA: {
		topic: "media",
		passes: "An embedded video is described by VideoObject markup or og:video.",
		fails: "The page embeds a playable video and declares neither VideoObject nor og:video.",
		ifPasses:
			"Google can find the video, show its thumbnail and consider it for video results and features such as key moments.",
		example: {
			good: '<iframe src="https://www.youtube.com/embed/abc123" title="Audit walkthrough"></iframe>\n<script type="application/ld+json">\n{"@context":"https://schema.org","@type":"VideoObject",\n "name":"Audit walkthrough","thumbnailUrl":"https://example.com/thumb.jpg",\n "uploadDate":"2026-03-04","contentUrl":"https://www.youtube.com/watch?v=abc123"}\n</script>',
			bad: '<iframe src="https://www.youtube.com/embed/abc123"></iframe>\n<!-- no VideoObject, no og:video -->',
			lang: "html",
		},
		howChecked:
			"The check counts videos a reader can play: a <video> element (a muted one without controls is a background, not a video) or a known player's <iframe> such as YouTube, Vimeo or Wistia. If there is one, it passes when the page's JSON-LD or Microdata declares a VideoObject, or when any og:video property is present. A video sitemap cannot be seen from the page, so a site that relies on one may see this reported.",
		manualCheck: [
			"Paste the page URL into the Rich Results Test (https://search.google.com/test/rich-results) and look for a Video item.",
			'Or press Ctrl+U and search for "VideoObject" and for og:video.',
		],
	},

	// ── Language, mobile and encoding ────────────────────────────────────────────────
	LANG_MISSING: {
		topic: "international",
		passes: 'The <html> element declares the page\'s language, e.g. lang="en".',
		fails: "There is no lang attribute on <html>.",
		ifPasses:
			"Screen readers pronounce the text correctly and browsers offer the right translation and hyphenation. Google decides the language from the text itself, so this is for readers, not rankings.",
		example: {
			good: '<!doctype html>\n<html lang="en">',
			bad: "<!doctype html>\n<html>",
			lang: "html",
		},
		howChecked:
			"The check reads the lang attribute of the <html> element. It fails only when the attribute is absent; whether the value matches the text is not judged here.",
		manualCheck: [
			'Press Ctrl+U and look at the <html …> tag on the first lines: does it carry lang="…"?',
			"Or in DevTools → Console run: document.documentElement.lang",
		],
	},
	HREFLANG_INVALID: {
		topic: "international",
		passes: "Every hreflang value is a valid ISO 639-1 language code, optionally with an ISO 3166-1 region, and the page names itself as canonical.",
		fails: 'An hreflang value is malformed — "ua" for Ukrainian, "jp" for Japanese, "en-UK" for Britain — or a page with hreflang names another URL as its canonical.',
		ifPasses:
			"Google can use the annotations to show readers the language or regional version meant for them.",
		example: {
			good: '<link rel="alternate" hreflang="en" href="https://example.com/en/guide/">\n<link rel="alternate" hreflang="uk" href="https://example.com/uk/guide/">\n<link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/guide/">\n<link rel="alternate" hreflang="x-default" href="https://example.com/guide/">',
			bad: '<link rel="alternate" hreflang="ua" href="https://example.com/uk/guide/">\n<link rel="alternate" hreflang="en-UK" href="https://example.com/en-gb/guide/">',
			lang: "html",
		},
		howChecked:
			'Each <link rel="alternate" hreflang> value is checked for structure and for existence: the language part must be a real two-letter ISO 639-1 language and an optional region a real ISO 3166-1 country (x-default is allowed). Country codes written as languages (ua, kz, jp…) and UK for the United Kingdom are named with the code that was meant. It also fails when the page declares hreflang but its canonical points to another URL, which takes the page out of its own set. A page with no hreflang is not judged.',
		manualCheck: [
			"Press Ctrl+U and search for hreflang; list the values.",
			"Check each one: language first (uk = Ukrainian, ja = Japanese, kk = Kazakh), then an optional country (GB, not UK).",
			"Check that the page's canonical points to the page itself.",
		],
	},
	HREFLANG_NO_SELF_REFERENCE: {
		topic: "international",
		passes: "The hreflang set lists this page as well as its other language versions.",
		fails: "The page lists other language versions but not itself.",
		ifPasses:
			"The language set is complete as Google requires, so its annotations are not ignored.",
		example: {
			good: '<!-- on https://example.com/en/guide/ -->\n<link rel="alternate" hreflang="en" href="https://example.com/en/guide/">\n<link rel="alternate" hreflang="de" href="https://example.com/de/guide/">',
			bad: '<!-- on https://example.com/en/guide/ -->\n<link rel="alternate" hreflang="de" href="https://example.com/de/guide/">',
			lang: "html",
		},
		howChecked:
			"When the page declares hreflang links, the check looks for one whose URL is this page's own address (a trailing slash is not a difference). A page with no hreflang, or whose canonical names another URL, is not judged.",
		manualCheck: [
			"Press Ctrl+U, search for hreflang, and check that one of the href values is the address of the page you are on.",
			'Or in DevTools → Console run: [...document.querySelectorAll("link[hreflang]")].some(l => l.href === location.href)',
		],
	},
	HREFLANG_NOT_RECIPROCAL: {
		topic: "international",
		passes: "Every language version the page names links back to it in its own hreflang.",
		fails: "A language version that answered 200 lists no hreflang link back to this page.",
		ifPasses:
			"The annotations are bidirectional, as Google requires, so they are used rather than ignored.",
		example: {
			good: '<!-- on /en/guide/ -->\n<link rel="alternate" hreflang="de" href="https://example.com/de/guide/">\n<!-- on /de/guide/ -->\n<link rel="alternate" hreflang="en" href="https://example.com/en/guide/">',
			bad: '<!-- on /en/guide/ -->\n<link rel="alternate" hreflang="de" href="https://example.com/de/guide/">\n<!-- on /de/guide/: no hreflang back to /en/guide/ -->',
			lang: "html",
		},
		howChecked:
			"During the crawl the tracker fetches the language versions the page names (skipping x-default, the page itself, invalid codes and development hosts). Only versions that answered 200 directly, without a redirect, are judged: each must list this page among its own hreflang links. A version that redirects, fails or could not be fetched within the crawl's budget is left out; if none could be judged, the check is not applicable.",
		manualCheck: [
			"On this page, press Ctrl+U and note every hreflang URL.",
			"Open each of those URLs, press Ctrl+U and search for hreflang: one of its links must point back to the first page.",
		],
	},
	VIEWPORT_MISSING: {
		topic: "international",
		passes: 'The page has <meta name="viewport" content="width=device-width, initial-scale=1">.',
		fails: "There is no viewport tag, so phones lay the page out at desktop width and shrink it.",
		ifPasses:
			"Phones lay the page out at their own width, so text is readable without zooming — and Google indexes the page as its smartphone crawler sees it.",
		example: {
			good: '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n</head>',
			bad: "<head>\n  <!-- no viewport meta tag -->\n</head>",
			lang: "html",
		},
		howChecked:
			'The check looks for a <meta name="viewport"> tag in the document. It fails only when the tag is absent; its content is not judged.',
		manualCheck: [
			'Press Ctrl+U and search for name="viewport".',
			"Open the page on a phone, or in DevTools' device toolbar (Ctrl+Shift+M): the text should fit the screen without zooming.",
		],
	},
	CHARSET_MISSING_OR_LATE: {
		topic: "international",
		passes: "The Content-Type header or a <meta charset> within the first 1,024 bytes says how the text is encoded.",
		fails: "Neither the header nor the first 1,024 bytes declare the encoding.",
		ifPasses:
			"Browsers decode the text correctly the first time, so accented letters, Cyrillic and curly quotes never turn into garbage.",
		example: {
			good: 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\n\n<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">',
			bad: 'HTTP/1.1 200 OK\nContent-Type: text/html\n\n<head>\n  <script>/* 3 KB of inline code */</script>\n  <meta charset="utf-8">',
			lang: "http",
		},
		howChecked:
			"The check passes when the Content-Type response header carries a charset parameter, or when a <meta charset> declaration ends within the first 1,024 bytes of the HTML, as the HTML standard requires. Otherwise it fails and reports where the declaration ends, if anywhere.",
		manualCheck: [
			"Run curl -I https://example.com/post/ and look for charset= in Content-Type.",
			"Otherwise press Ctrl+U: <meta charset> should be among the very first lines of <head>, before any large inline script or style.",
		],
	},

	// ── Social previews ──────────────────────────────────────────────────────────────
	OG_TAGS_MISSING: {
		topic: "sharing",
		passes: "The page has og:title, og:description and og:image.",
		fails: "One or more of those three is missing, so each platform guesses that part of the preview.",
		ifPasses:
			"A shared link shows the title, description and image you chose on social networks and in messengers. It does not affect Google rankings.",
		example: {
			good: '<meta property="og:title" content="Local SEO checklist for 2026">\n<meta property="og:description" content="Twelve steps to rank in the map pack.">\n<meta property="og:image" content="https://example.com/img/local-seo-1200.jpg">',
			bad: '<meta property="og:title" content="Local SEO checklist for 2026">\n<!-- no og:description, no og:image -->',
			lang: "html",
		},
		howChecked:
			"The check reads the page's Open Graph properties and fails when any of og:title, og:description or og:image is absent, naming the missing ones.",
		manualCheck: [
			"Paste the URL into the Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/) and look at the preview and the warnings.",
			"Or press Ctrl+U and search for og:title, og:description and og:image.",
		],
	},
	OG_URL_MISMATCH: {
		topic: "sharing",
		passes: "og:url names this page's own address (a trailing slash is not a difference).",
		fails: "og:url names a different address than the one the page is served at.",
		ifPasses:
			"Shares and likes are collected under the page's real address, the same one search results use. It does not affect Google rankings.",
		example: {
			good: '<!-- on https://example.com/blog/local-seo/ -->\n<meta property="og:url" content="https://example.com/blog/local-seo/">',
			bad: '<!-- on https://example.com/blog/local-seo/ -->\n<meta property="og:url" content="https://example.com/blog/local-seo/?utm_source=newsletter">',
			lang: "html",
		},
		howChecked:
			"When the page declares og:url, the check resolves it and compares it with the address the page was served at, as the same document (a trailing slash is not a difference). It is not judged when there is no og:url, when og:url points at a development host (DEVELOPMENT_HOST_REFERENCES reports that), or when the page's canonical names another URL.",
		manualCheck: [
			"Press Ctrl+U, search for og:url and compare its content with the address in the browser bar.",
			"Or paste the URL into the Facebook Sharing Debugger and read the Canonical URL it reports.",
		],
	},
	PREVIEW_IMAGE_TOO_SMALL: {
		topic: "sharing",
		passes: `The page's own image is at least ${thousands(C.PREVIEW_IMAGE_TOO_SMALL.min)} px wide, read from the file itself.`,
		fails: `The og:image (or article image) is narrower than ${thousands(C.PREVIEW_IMAGE_TOO_SMALL.min)} px.`,
		ifPasses:
			"The image is large enough for Google Discover's large previews and for sharp share cards on social networks.",
		example: {
			good: '<meta property="og:image" content="https://example.com/img/local-seo-1200x675.jpg">\n<!-- the file itself is 1200 × 675 px -->',
			bad: '<meta property="og:image" content="https://example.com/img/local-seo-300x169.jpg">\n<!-- the file itself is 300 × 169 px -->',
			lang: "html",
		},
		howChecked: `During the crawl the tracker downloads the start of the page's own image — og:image, else the first image of its article markup — and reads the width from the file's header, not from the size the page declares. It fails below ${thousands(C.PREVIEW_IMAGE_TOO_SMALL.min)} px. It is not judged when the page names no image, the file could not be read (or robots.txt forbids it), or the image is the site logo (PREVIEW_IMAGE_IS_LOGO reports that).`,
		manualCheck: [
			"Press Ctrl+U, search for og:image and open that image URL in a new tab.",
			"Right-click the image → Inspect, or hover the src in DevTools, to see its natural width.",
		],
	},
	PREVIEW_IMAGE_IS_LOGO: {
		topic: "sharing",
		passes: "The page's own image is something other than the site logo.",
		fails: "The og:image or article image is the site's logo — the usual fallback for a post without a featured image.",
		ifPasses:
			"Previews in Discover and on social networks show something about this post, not the same logo on every share.",
		example: {
			good: '<meta property="og:image" content="https://example.com/img/local-seo-checklist.jpg">',
			bad: '<meta property="og:image" content="https://example.com/wp-content/uploads/logo.png">',
			lang: "html",
		},
		howChecked:
			"The check takes the og:image and the images of the article markup and fails if one is the same URL as a logo the page's structured data declares, or a file named as a logo. A page that names no image for itself is not judged.",
		manualCheck: [
			"Press Ctrl+U, search for og:image and open the image: is it the post's picture or the site's logo?",
			"Check the Facebook Sharing Debugger preview for the same thing.",
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
