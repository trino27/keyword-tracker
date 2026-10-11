import { SEO_ISSUE_CATALOGUE, type TLighthouseIssueCode } from "@app/contracts";
import type { ICheckCriteria } from "../checkTopics";

/** What is particular to one Lighthouse audit; how it is checked is the same for all. */
interface ILighthouseSpec {
	passes: string;
	fails: string;
	ifPasses: string;
	good: string;
	bad: string;
}

const CATEGORY_NAME = { seo: "SEO", accessibility: "Accessibility" } as const;

/**
 * Lighthouse is not re-implemented here: the tracker reads Lighthouse's own verdict from
 * Google's answer. So how a Lighthouse code is checked — by the tracker and by hand — is
 * one procedure, filled in with the audit's id and the categories that score it.
 */
function lighthouseCriteria(code: TLighthouseIssueCode, spec: ILighthouseSpec): ICheckCriteria {
	const { audit, weights } = SEO_ISSUE_CATALOGUE[code];
	const categories = (Object.keys(weights) as (keyof typeof CATEGORY_NAME)[]).map(
		(category) => CATEGORY_NAME[category],
	);
	const inCategories = categories.join(" and ");
	return {
		topic: "seo" in weights ? "lighthouseSeo" : "accessibility",
		passes: spec.passes,
		fails: spec.fails,
		ifPasses: spec.ifPasses,
		example: { good: spec.good, bad: spec.bad, lang: "html" },
		howChecked: `After each crawl (at most once every 24 hours) Google PageSpeed Insights loads the page as a phone and runs Lighthouse on it; the tracker reads the result of Lighthouse's own "${audit}" audit from that answer and does not judge it again. A failed audit becomes this issue and a passed one counts as passed; an audit Lighthouse reports as not applicable is left out, and one that errored is not recorded at all. Lighthouse scores it in its ${inCategories} category; in this tracker's score it counts at its own level.`,
		manualCheck: [
			"Open PageSpeed Insights (https://pagespeed.web.dev), enter the page URL and choose Mobile.",
			`In the ${inCategories} section, find the audit — failed ones are listed first, passed ones under “Passed audits”. Expand it to see the elements that fail.`,
			`Or in Chrome DevTools → Lighthouse, tick ${inCategories}, choose Mobile and run it on your own machine (audit id: ${audit}).`,
		],
	};
}

const SPECS: Record<TLighthouseIssueCode, ILighthouseSpec> = {
	// ── SEO audits ───────────────────────────────────────────────────────────────────
	LH_IS_CRAWLABLE: {
		passes: "No rule keeps every search engine from indexing the page.",
		fails: "A noindex or none in a robots meta tag or X-Robots-Tag, a past unavailable_after date, or a robots.txt Disallow for the URL. A rule aimed at one crawler only is a warning, not a failure.",
		ifPasses:
			"Search engines may crawl and index the page, so it can appear in results at all.",
		good: '<meta name="robots" content="max-image-preview:large">',
		bad: '<meta name="robots" content="noindex">',
	},
	LH_DOCUMENT_TITLE: {
		passes: "The page has a <title> with text.",
		fails: "There is no <title>, or it is empty.",
		ifPasses:
			"Search results, browser tabs, bookmarks and screen readers all get a name for the page.",
		good: "<title>Local SEO checklist for small businesses</title>",
		bad: "<title></title>",
	},
	LH_META_DESCRIPTION: {
		passes: 'The page has a <meta name="description"> with text.',
		fails: "There is no meta description, or it is empty.",
		ifPasses: "Google has your own summary to use as the snippet when it fits the search.",
		good: '<meta name="description" content="Twelve steps to rank in the local map pack.">',
		bad: '<meta name="description" content="">',
	},
	LH_HTTP_STATUS_CODE: {
		passes: "The page answers with a successful status.",
		fails: "The page answers 400 or above — a client or server error.",
		ifPasses:
			"Google can index the page; an error status tells it the page does not exist or is broken.",
		good: "HTTP/1.1 200 OK",
		bad: "HTTP/1.1 404 Not Found",
	},
	LH_LINK_TEXT: {
		passes: "No link uses generic text such as “click here”, “read more” or “here”.",
		fails: "One or more links say only something generic.",
		ifPasses:
			"Google and readers learn from each link's words what the page behind it is about.",
		good: 'Read the <a href="/local-seo-checklist/">local SEO checklist</a>.',
		bad: 'For the checklist, <a href="/local-seo-checklist/">click here</a>.',
	},
	LH_CRAWLABLE_ANCHORS: {
		passes: "Every link has an href that resolves to a real web address.",
		fails: "A link has no href, an empty one, or a javascript: one, so a crawler cannot follow it.",
		ifPasses: "Google can follow every link to discover the pages behind it.",
		good: '<a href="/pricing/">Pricing</a>',
		bad: '<a onclick="goTo(\'pricing\')">Pricing</a>\n<a href="javascript:void(0)">Pricing</a>',
	},
	LH_ROBOTS_TXT: {
		passes: "robots.txt can be fetched and every line is valid.",
		fails: "robots.txt answers a server error, cannot be fetched, or has lines Lighthouse cannot parse.",
		ifPasses: "Crawlers read the rules the way you wrote them.",
		good: "User-agent: *\nDisallow: /cart/\nSitemap: https://example.com/sitemap.xml",
		bad: "User-agent *\nDisalow: /cart/\nSitemap: /sitemap.xml",
	},
	LH_IMAGE_ALT: {
		passes: 'Every <img> has an alt attribute (alt="" for decorative ones).',
		fails: "An image has no alt attribute.",
		ifPasses:
			"Screen readers describe each image, and Google gets text to understand it for image search.",
		good: '<img src="/img/map-pack.png" alt="Map pack with three local results">',
		bad: '<img src="/img/map-pack.png">',
	},
	LH_HREFLANG: {
		passes: "Every hreflang value is a valid language (and optional region) code with a usable URL.",
		fails: "An hreflang value is not a known language code, or its href is not a valid URL.",
		ifPasses: "Google can show each reader the language version meant for them.",
		good: '<link rel="alternate" hreflang="en-GB" href="https://example.com/en-gb/">',
		bad: '<link rel="alternate" hreflang="en-UK" href="/en-gb/">',
	},
	LH_CANONICAL: {
		passes: "The canonical is a single valid absolute URL that does not point to another domain or to the home page by mistake.",
		fails: "Several canonicals that disagree, an invalid or relative URL, one on another domain, or one pointing to the site's root from an inner page.",
		ifPasses: "Google gets one clear signal about which URL to show for this content.",
		good: '<link rel="canonical" href="https://example.com/blog/local-seo/">',
		bad: '<link rel="canonical" href="https://example.com/">  <!-- on an inner page -->',
	},

	// ── Accessibility audits ─────────────────────────────────────────────────────────
	LH_ACCESSKEYS: {
		passes: "Every accesskey value is used once.",
		fails: "Two elements share the same accesskey.",
		ifPasses: "Keyboard shortcuts do what they say instead of colliding.",
		good: '<a href="/" accesskey="h">Home</a>\n<a href="/search" accesskey="s">Search</a>',
		bad: '<a href="/" accesskey="s">Home</a>\n<a href="/search" accesskey="s">Search</a>',
	},
	LH_ARIA_ALLOWED_ATTR: {
		passes: "Every aria-* attribute is one the element's role supports.",
		fails: "An element carries an ARIA attribute its role does not allow.",
		ifPasses: "Screen readers announce each element's state correctly.",
		good: '<button aria-pressed="false">Bold</button>',
		bad: '<a href="/" aria-checked="true">Home</a>',
	},
	LH_ARIA_COMMAND_NAME: {
		passes: 'Every element with role="button", "link" or "menuitem" has an accessible name.',
		fails: "A custom button, link or menu item has no text, aria-label or aria-labelledby.",
		ifPasses: "Screen reader users hear what each control does.",
		good: '<div role="button" aria-label="Close dialog">×</div>',
		bad: '<div role="button"><svg>…</svg></div>',
	},
	LH_ARIA_CONDITIONAL_ATTR: {
		passes: "ARIA states are used only where the element's role allows them.",
		fails: "A state such as aria-checked or aria-expanded is set where its role forbids it — e.g. aria-checked on a native checkbox.",
		ifPasses: "Assistive technology reports the real state, not a contradictory one.",
		good: '<input type="checkbox" checked>',
		bad: '<input type="checkbox" aria-checked="false" checked>',
	},
	LH_ARIA_DEPRECATED_ROLE: {
		passes: "No element uses a deprecated ARIA role.",
		fails: "An element uses a retired role such as directory or doc-biblioentry.",
		ifPasses: "Current screen readers understand every role on the page.",
		good: '<ul role="list">…</ul>',
		bad: '<ul role="directory">…</ul>',
	},
	LH_ARIA_DIALOG_NAME: {
		passes: 'Every role="dialog" or "alertdialog" has an accessible name.',
		fails: "A dialog has no aria-label or aria-labelledby.",
		ifPasses: "Screen reader users know what a pop-up is about the moment it opens.",
		good: '<div role="dialog" aria-labelledby="t"><h2 id="t">Subscribe</h2>…</div>',
		bad: '<div role="dialog"><h2>Subscribe</h2>…</div>',
	},
	LH_ARIA_HIDDEN_BODY: {
		passes: '<body> has no aria-hidden="true".',
		fails: 'The whole <body> is marked aria-hidden="true".',
		ifPasses: "Screen reader users can reach the page's content at all.",
		good: "<body>…</body>",
		bad: '<body aria-hidden="true">…</body>',
	},
	LH_ARIA_HIDDEN_FOCUS: {
		passes: "Nothing hidden with aria-hidden can receive keyboard focus.",
		fails: "An aria-hidden element is, or contains, something focusable.",
		ifPasses: "Keyboard users never land on a control that screen readers say is not there.",
		good: '<div aria-hidden="true"><a href="/x" tabindex="-1">…</a></div>',
		bad: '<div aria-hidden="true"><a href="/x">Read more</a></div>',
	},
	LH_ARIA_INPUT_FIELD_NAME: {
		passes: "Every custom input (combobox, listbox, searchbox, slider, spinbutton, textbox) has a name.",
		fails: "A custom input field has no label, aria-label or aria-labelledby.",
		ifPasses: "Screen reader users know what to type or choose.",
		good: '<div role="textbox" contenteditable aria-label="Comment"></div>',
		bad: '<div role="textbox" contenteditable></div>',
	},
	LH_ARIA_METER_NAME: {
		passes: 'Every role="meter" has an accessible name.',
		fails: "A meter has no name.",
		ifPasses: "Screen reader users know what the gauge measures.",
		good: '<div role="meter" aria-valuenow="70" aria-label="Disk usage"></div>',
		bad: '<div role="meter" aria-valuenow="70"></div>',
	},
	LH_ARIA_PROGRESSBAR_NAME: {
		passes: 'Every role="progressbar" has an accessible name.',
		fails: "A progress bar has no name.",
		ifPasses: "Screen reader users know what is loading.",
		good: '<div role="progressbar" aria-valuenow="40" aria-label="Upload progress"></div>',
		bad: '<div role="progressbar" aria-valuenow="40"></div>',
	},
	LH_ARIA_PROHIBITED_ATTR: {
		passes: "No element is named with aria-label or aria-labelledby where its role forbids naming.",
		fails: "A label sits on an element that cannot be named, such as a plain <div> or <span> without a role, so screen readers ignore it.",
		ifPasses: "The labels you wrote are actually read out.",
		good: '<button aria-label="Search">🔍</button>',
		bad: '<span aria-label="Search">🔍</span>',
	},
	LH_ARIA_REQUIRED_ATTR: {
		passes: "Every ARIA role has the attributes it requires.",
		fails: 'A role lacks a required attribute — e.g. role="checkbox" without aria-checked, role="slider" without aria-valuenow.',
		ifPasses: "Custom controls report their state to assistive technology.",
		good: '<div role="checkbox" aria-checked="false" tabindex="0">Remember me</div>',
		bad: '<div role="checkbox" tabindex="0">Remember me</div>',
	},
	LH_ARIA_REQUIRED_CHILDREN: {
		passes: "Roles that need particular children have them.",
		fails: 'A container role lacks its required items — e.g. role="list" with no listitem, role="menu" with no menuitem.',
		ifPasses: "Screen readers can announce lists and menus with their items.",
		good: '<div role="list"><div role="listitem">One</div></div>',
		bad: '<div role="list"><div>One</div></div>',
	},
	LH_ARIA_REQUIRED_PARENT: {
		passes: "Roles that must sit inside a particular parent do.",
		fails: 'An item role is outside its group — e.g. role="listitem" outside a list, role="tab" outside a tablist.',
		ifPasses: "Screen readers announce each item as part of its group (“item 2 of 5”).",
		good: '<div role="tablist"><button role="tab">Overview</button></div>',
		bad: '<div><button role="tab">Overview</button></div>',
	},
	LH_ARIA_ROLES: {
		passes: "Every role attribute is a valid ARIA role.",
		fails: "A role value is misspelled or invented.",
		ifPasses: "Assistive technology understands what each element is.",
		good: '<nav role="navigation">…</nav>',
		bad: '<div role="navgation">…</div>',
	},
	LH_ARIA_TEXT: {
		passes: 'Nothing inside role="text" is focusable.',
		fails: 'A role="text" element contains a link or another focusable element.',
		ifPasses: "Keyboard users do not land on a stop that screen readers announce as nothing.",
		good: '<span role="text">Price: <b>$20</b></span>',
		bad: '<span role="text">Price <a href="/pricing">$20</a></span>',
	},
	LH_ARIA_TOGGLE_FIELD_NAME: {
		passes: "Every custom checkbox, radio, switch or checkable menu item has a name.",
		fails: "A toggle has no text, aria-label or aria-labelledby.",
		ifPasses: "Screen reader users know what they are switching on or off.",
		good: '<div role="switch" aria-checked="true" aria-label="Dark mode"></div>',
		bad: '<div role="switch" aria-checked="true"></div>',
	},
	LH_ARIA_TOOLTIP_NAME: {
		passes: 'Every role="tooltip" has text or a name.',
		fails: "A tooltip is empty for screen readers.",
		ifPasses: "The help a tooltip gives reaches screen reader users too.",
		good: '<div role="tooltip" id="tip">Opens in a new tab</div>',
		bad: '<div role="tooltip" id="tip"></div>',
	},
	LH_ARIA_TREEITEM_NAME: {
		passes: 'Every role="treeitem" has a name.',
		fails: "An entry in a tree menu has no text or label.",
		ifPasses: "Screen reader users can navigate expandable menus by name.",
		good: '<li role="treeitem">Guides</li>',
		bad: '<li role="treeitem"><svg>…</svg></li>',
	},
	LH_ARIA_VALID_ATTR_VALUE: {
		passes: "Every ARIA attribute has a valid value.",
		fails: 'A value is invalid — e.g. aria-expanded="yes", or aria-labelledby pointing to an id that does not exist.',
		ifPasses: "Screen readers get states and labels they can actually use.",
		good: '<button aria-expanded="false" aria-controls="menu">Menu</button>',
		bad: '<button aria-expanded="yes" aria-controls="missing-id">Menu</button>',
	},
	LH_ARIA_VALID_ATTR: {
		passes: "Every aria-* attribute name is a real ARIA attribute.",
		fails: "An attribute name is misspelled or invented, e.g. aria-lable.",
		ifPasses: "The labels and states you meant to add are actually in effect.",
		good: '<button aria-label="Close">×</button>',
		bad: '<button aria-lable="Close">×</button>',
	},
	LH_BUTTON_NAME: {
		passes: "Every <button> has text, aria-label or aria-labelledby.",
		fails: "A button has no accessible name — typically an icon-only button.",
		ifPasses: "Screen reader users hear what each button does.",
		good: '<button aria-label="Open menu"><svg aria-hidden="true">…</svg></button>',
		bad: "<button><svg>…</svg></button>",
	},
	LH_BYPASS: {
		passes: "The page offers a way to skip repeated blocks: a skip link, landmarks or headings.",
		fails: "There is no skip link, landmark or heading to jump past the navigation.",
		ifPasses:
			"Keyboard and screen reader users reach the article without tabbing through the whole menu.",
		good: '<a href="#main" class="skip">Skip to content</a>\n<main id="main">…</main>',
		bad: '<div class="menu">…40 links…</div>\n<div class="content">…</div>',
	},
	LH_COLOR_CONTRAST: {
		passes: "Text contrasts with its background at least 4.5:1 (3:1 for large text).",
		fails: "Some text is too light or too close in colour to its background.",
		ifPasses: "Text stays readable for people with low vision and on phones in sunlight.",
		good: '<p style="color:#333;background:#fff">Readable text</p>',
		bad: '<p style="color:#aaa;background:#fff">Faint grey text</p>',
	},
	LH_DEFINITION_LIST: {
		passes: "Every <dl> contains only <dt>/<dd> groups (or <div> wrapping them).",
		fails: "A <dl> holds other elements or is out of order.",
		ifPasses: "Screen readers announce terms and their definitions as pairs.",
		good: "<dl><dt>LCP</dt><dd>Largest Contentful Paint</dd></dl>",
		bad: "<dl><p>LCP</p><dd>Largest Contentful Paint</dd></dl>",
	},
	LH_DLITEM: {
		passes: "Every <dt> and <dd> sits inside a <dl>.",
		fails: "A term or definition is outside a definition list.",
		ifPasses: "Assistive technology recognises the terms as a glossary.",
		good: "<dl><dt>INP</dt><dd>Interaction to Next Paint</dd></dl>",
		bad: "<div><dt>INP</dt><dd>Interaction to Next Paint</dd></div>",
	},
	LH_DUPLICATE_ID_ARIA: {
		passes: "Every id referenced by an ARIA attribute is unique on the page.",
		fails: "Two elements share an id that a label or description points to.",
		ifPasses: "Each label is attached to the field it was written for.",
		good: '<label id="email-label">Email</label>\n<input aria-labelledby="email-label">',
		bad: '<span id="label">Email</span><span id="label">Phone</span>\n<input aria-labelledby="label">',
	},
	LH_FORM_FIELD_MULTIPLE_LABELS: {
		passes: "Every form field has at most one <label>.",
		fails: "A field is labelled by two or more <label> elements.",
		ifPasses: "Screen readers announce one clear name for each field.",
		good: '<label for="q">Search</label><input id="q">',
		bad: '<label for="q">Search</label><label for="q">Query</label><input id="q">',
	},
	LH_FRAME_TITLE: {
		passes: "Every <iframe> and <frame> has a title.",
		fails: "An embedded frame has no title.",
		ifPasses:
			"Screen reader users know what an embed (video, map, form) is before entering it.",
		good: '<iframe src="https://www.youtube.com/embed/abc" title="Audit walkthrough video"></iframe>',
		bad: '<iframe src="https://www.youtube.com/embed/abc"></iframe>',
	},
	LH_HEADING_ORDER: {
		passes: "Heading levels go down one step at a time.",
		fails: "A heading skips a level, e.g. <h2> followed by <h4>.",
		ifPasses: "The page's outline makes sense to screen reader users navigating by headings.",
		good: "<h2>Setup</h2>\n<h3>Step 1</h3>",
		bad: "<h2>Setup</h2>\n<h4>Step 1</h4>",
	},
	LH_HTML_HAS_LANG: {
		passes: "<html> has a lang attribute.",
		fails: "<html> has no lang attribute.",
		ifPasses: "Screen readers pronounce the text in the right language.",
		good: '<html lang="en">',
		bad: "<html>",
	},
	LH_HTML_LANG_VALID: {
		passes: "The <html lang> value is a valid language code.",
		fails: "The lang value is not a valid BCP 47 language tag.",
		ifPasses: "Browsers and screen readers can use the declared language.",
		good: '<html lang="en-GB">',
		bad: '<html lang="english">',
	},
	LH_HTML_XML_LANG_MISMATCH: {
		passes: "lang and xml:lang on <html> name the same base language.",
		fails: "lang and xml:lang name different languages.",
		ifPasses: "Assistive technology gets one unambiguous language.",
		good: '<html lang="en" xml:lang="en">',
		bad: '<html lang="en" xml:lang="de">',
	},
	LH_INPUT_BUTTON_NAME: {
		passes: 'Every <input type="button|submit|reset"> has a value or label.',
		fails: "A form button has no text.",
		ifPasses: "Screen reader users know what the button submits or resets.",
		good: '<input type="submit" value="Subscribe">',
		bad: '<input type="submit" value="">',
	},
	LH_INPUT_IMAGE_ALT: {
		passes: 'Every <input type="image"> has alt text.',
		fails: "An image button has no alt.",
		ifPasses: "Screen reader users know what the image button does.",
		good: '<input type="image" src="/go.png" alt="Search">',
		bad: '<input type="image" src="/go.png">',
	},
	LH_LABEL: {
		passes: "Every form field has a label.",
		fails: "An input, textarea or select has no <label>, aria-label or aria-labelledby.",
		ifPasses:
			"Every visitor knows what each field is for — a placeholder alone disappears as they type.",
		good: '<label for="email">Email</label>\n<input id="email" type="email">',
		bad: '<input type="email" placeholder="Email">',
	},
	LH_LINK_IN_TEXT_BLOCK: {
		passes: "Links inside text are distinguishable by more than colour — usually an underline.",
		fails: "A link in a paragraph differs from the text around it only by colour.",
		ifPasses: "People who cannot tell the colours apart can still find the links.",
		good: '<p>See the <a href="/guide" style="text-decoration:underline">guide</a>.</p>',
		bad: '<p>See the <a href="/guide" style="text-decoration:none;color:#0055aa">guide</a>.</p>',
	},
	LH_LINK_NAME: {
		passes: "Every link has a readable name: text, alt on its image, or aria-label.",
		fails: "A link has no accessible name — an icon or an image without alt.",
		ifPasses:
			"Screen reader users hear where each link goes, and Google gets text describing the destination.",
		good: '<a href="/twitter" aria-label="Our Twitter profile"><svg aria-hidden="true">…</svg></a>',
		bad: '<a href="/twitter"><svg>…</svg></a>',
	},
	LH_LIST: {
		passes: "Every <ul> and <ol> contains only <li> (and script or template) elements.",
		fails: "A list holds stray elements directly.",
		ifPasses: "Screen readers announce lists with the right count of items.",
		good: "<ul><li>One</li><li>Two</li></ul>",
		bad: "<ul><div>One</div><li>Two</li></ul>",
	},
	LH_LISTITEM: {
		passes: "Every <li> is inside a <ul>, <ol> or <menu>.",
		fails: "A list item sits outside a list.",
		ifPasses: "Assistive technology recognises items as part of a list.",
		good: "<ol><li>Step one</li></ol>",
		bad: "<div><li>Step one</li></div>",
	},
	LH_META_REFRESH: {
		passes: "The page does not refresh or redirect itself on a timer.",
		fails: 'A <meta http-equiv="refresh"> reloads or redirects the page after a delay.',
		ifPasses: "Readers are not moved on before they have finished reading.",
		good: "<!-- a server-side 301 redirect instead -->",
		bad: '<meta http-equiv="refresh" content="5; url=/new-page/">',
	},
	LH_META_VIEWPORT: {
		passes: "The viewport lets visitors zoom: no user-scalable=no, and maximum-scale not below 5.",
		fails: "The viewport blocks zooming.",
		ifPasses: "People with low vision can pinch to zoom on phones.",
		good: '<meta name="viewport" content="width=device-width, initial-scale=1">',
		bad: '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">',
	},
	LH_OBJECT_ALT: {
		passes: "Every <object> has a text alternative.",
		fails: "An embedded object has no alternative text.",
		ifPasses: "Visitors who cannot see the object know what it contains.",
		good: '<object data="/chart.svg" type="image/svg+xml" aria-label="Traffic chart"></object>',
		bad: '<object data="/chart.svg" type="image/svg+xml"></object>',
	},
	LH_SELECT_NAME: {
		passes: "Every <select> has a label.",
		fails: "A drop-down has no label, aria-label or aria-labelledby.",
		ifPasses: "Screen reader users know what they are choosing.",
		good: '<label for="c">Country</label>\n<select id="c">…</select>',
		bad: "<select>…</select>",
	},
	LH_SKIP_LINK: {
		passes: "Every skip link points to an element that exists and can receive focus.",
		fails: "A skip link targets nothing, or something that cannot be focused.",
		ifPasses: "The “Skip to content” link actually takes keyboard users to the content.",
		good: '<a href="#main">Skip to content</a>\n<main id="main" tabindex="-1">…</main>',
		bad: '<a href="#content">Skip to content</a>\n<main id="main">…</main>',
	},
	LH_TABINDEX: {
		passes: "No element has a tabindex greater than 0.",
		fails: "A positive tabindex forces an element ahead in the tab order.",
		ifPasses: "Keyboard focus follows the reading order of the page.",
		good: '<button tabindex="0">Subscribe</button>',
		bad: '<button tabindex="3">Subscribe</button>',
	},
	LH_TARGET_SIZE: {
		passes: "Tap targets are at least 24×24 CSS pixels, or spaced far enough apart.",
		fails: "Links or buttons are too small or too close together to tap reliably.",
		ifPasses: "Phone users hit the link they meant on the first try.",
		good: '<a href="/next" style="display:inline-block;min-width:44px;min-height:44px">Next</a>',
		bad: '<a href="/1" style="font-size:9px">1</a><a href="/2" style="font-size:9px">2</a>',
	},
	LH_TD_HEADERS_ATTR: {
		passes: "Every cell's headers attribute points to header cells in the same table.",
		fails: "A cell's headers attribute refers to ids that are not in the table.",
		ifPasses: "Screen readers read each data cell with its correct column and row headers.",
		good: '<th id="price">Price</th> … <td headers="price">$20</td>',
		bad: '<th id="price">Price</th> … <td headers="cost">$20</td>',
	},
	LH_TH_HAS_DATA_CELLS: {
		passes: "Every table header has data cells it describes.",
		fails: "A <th> has no data cells under or beside it.",
		ifPasses: "Tables read as data tables, with each header attached to its values.",
		good: "<tr><th>Plan</th><th>Price</th></tr>\n<tr><td>Pro</td><td>$20</td></tr>",
		bad: "<tr><th>Plan</th><th>Price</th><th>Notes</th></tr>\n<tr><td>Pro</td><td>$20</td></tr>",
	},
	LH_VALID_LANG: {
		passes: "Every lang attribute inside the page is a valid language code.",
		fails: "A passage marks its language with an invalid code.",
		ifPasses: "Screen readers switch pronunciation correctly for quotes in other languages.",
		good: '<blockquote lang="fr">Bonjour</blockquote>',
		bad: '<blockquote lang="french">Bonjour</blockquote>',
	},
	LH_VIDEO_CAPTION: {
		passes: 'Every <video> has a <track kind="captions">.',
		fails: "A video has no captions track.",
		ifPasses:
			"Deaf and hard-of-hearing visitors, and anyone watching muted, can follow the video.",
		good: '<video src="/demo.mp4" controls>\n  <track kind="captions" src="/demo.en.vtt" srclang="en">\n</video>',
		bad: '<video src="/demo.mp4" controls></video>',
	},
	LH_LANDMARK_ONE_MAIN: {
		passes: "The page has one main landmark.",
		fails: 'The page has no <main> (or role="main").',
		ifPasses: "Screen reader users can jump straight to the content.",
		good: "<main>…the article…</main>",
		bad: '<div class="content">…the article…</div>',
	},
	LH_AUTOCOMPLETE_VALID: {
		passes: "Every autocomplete value is a valid token for its field.",
		fails: "An autocomplete hint is misspelled or does not fit the field.",
		ifPasses:
			"Browsers fill forms correctly, which helps everyone and especially people with motor or memory difficulties.",
		good: '<input type="email" autocomplete="email">',
		bad: '<input type="email" autocomplete="e-mail-address">',
	},
	LH_PRESENTATION_ROLE_CONFLICT: {
		passes: 'Elements marked role="presentation" or "none" carry no global ARIA attribute or tabindex.',
		fails: "A decorative element still has a focus stop or ARIA attribute, so screen readers expose it anyway.",
		ifPasses: "What you marked as decoration really stays out of the way.",
		good: '<img src="/divider.svg" alt="" role="presentation">',
		bad: '<img src="/divider.svg" alt="" role="presentation" tabindex="0">',
	},
	LH_SVG_IMG_ALT: {
		passes: 'Every <svg role="img"> has a text alternative (title, aria-label or aria-labelledby).',
		fails: "An SVG marked as an image has no description.",
		ifPasses: "Screen reader users know what each icon or graphic means.",
		good: '<svg role="img" aria-label="Warning">…</svg>',
		bad: '<svg role="img">…</svg>',
	},
};

/** The audits Lighthouse scores in the PageSpeed measurement: SEO and accessibility. */
export const LIGHTHOUSE_CRITERIA = Object.fromEntries(
	(Object.keys(SPECS) as TLighthouseIssueCode[]).map((code) => [
		code,
		lighthouseCriteria(code, SPECS[code]),
	]),
) as Record<TLighthouseIssueCode, ICheckCriteria>;
