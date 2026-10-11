import { ISSUE_SOURCES as SOURCE } from '../crawl/crawl-catalogue.constant.js';
import type {
  ILighthouseIssueDefinition,
  ISeoIssueSource,
} from '../issue-definition.interface.js';

/**
 * Lighthouse's own documentation for each audit: the page its answer links as "Learn more"
 * — Chrome's for the SEO audits, Deque's axe rules for the accessibility ones, at the axe
 * version Lighthouse 13.5.0 runs. Opened and read against each entry on 2026-10-11.
 */
const LH_SOURCE = {
  accesskeys: {
    title: 'Deque axe rules: accesskey attribute value should be unique',
    url: 'https://dequeuniversity.com/rules/axe/4.13/accesskeys',
  },
  ariaAllowedAttr: {
    title: 'Deque axe rules: Elements must only use supported ARIA attributes',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-allowed-attr',
  },
  ariaCommandName: {
    title: 'Deque axe rules: ARIA commands must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-command-name',
  },
  ariaConditionalAttr: {
    title:
      "Deque axe rules: ARIA attributes must be used as specified for the element's role",
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-conditional-attr',
  },
  ariaDeprecatedRole: {
    title: 'Deque axe rules: Deprecated ARIA roles must not be used',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-deprecated-role',
  },
  ariaDialogName: {
    title:
      'Deque axe rules: ARIA dialog and alertdialog nodes should have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-dialog-name',
  },
  ariaHiddenBody: {
    title:
      'Deque axe rules: aria-hidden="true" must not be present on the document body',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-hidden-body',
  },
  ariaHiddenFocus: {
    title:
      'Deque axe rules: ARIA hidden element must not be focusable or contain focusable elements',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-hidden-focus',
  },
  ariaInputFieldName: {
    title: 'Deque axe rules: ARIA input fields must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-input-field-name',
  },
  ariaMeterName: {
    title: 'Deque axe rules: ARIA meter nodes must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-meter-name',
  },
  ariaProgressbarName: {
    title:
      'Deque axe rules: ARIA progressbar nodes must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-progressbar-name',
  },
  ariaProhibitedAttr: {
    title: 'Deque axe rules: Elements must only use permitted ARIA attributes',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-prohibited-attr',
  },
  ariaRequiredAttr: {
    title: 'Deque axe rules: Required ARIA attributes must be provided',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-required-attr',
  },
  ariaRequiredChildren: {
    title:
      'Deque axe rules: Certain ARIA roles must contain particular children',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-required-children',
  },
  ariaRequiredParent: {
    title:
      'Deque axe rules: Certain ARIA roles must be contained by particular parents',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-required-parent',
  },
  ariaRoles: {
    title: 'Deque axe rules: ARIA roles used must conform to valid values',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-roles',
  },
  ariaText: {
    title: 'Deque axe rules: "role=text" should have no focusable descendants',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-text',
  },
  ariaToggleFieldName: {
    title: 'Deque axe rules: ARIA toggle fields must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-toggle-field-name',
  },
  ariaTooltipName: {
    title: 'Deque axe rules: ARIA tooltip nodes must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-tooltip-name',
  },
  ariaTreeitemName: {
    title:
      'Deque axe rules: ARIA treeitem nodes should have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-treeitem-name',
  },
  ariaValidAttr: {
    title: 'Deque axe rules: ARIA attributes must conform to valid names',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-valid-attr',
  },
  ariaValidAttrValue: {
    title: 'Deque axe rules: ARIA attributes must conform to valid values',
    url: 'https://dequeuniversity.com/rules/axe/4.13/aria-valid-attr-value',
  },
  autocompleteValid: {
    title: 'Deque axe rules: autocomplete attribute must be used correctly',
    url: 'https://dequeuniversity.com/rules/axe/4.13/autocomplete-valid',
  },
  buttonName: {
    title: 'Deque axe rules: Buttons must have discernible text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/button-name',
  },
  bypass: {
    title: 'Deque axe rules: Page must have means to bypass repeated blocks',
    url: 'https://dequeuniversity.com/rules/axe/4.13/bypass',
  },
  canonical: {
    title: 'Lighthouse: Document does not have a valid rel=canonical',
    url: 'https://developer.chrome.com/docs/lighthouse/seo/canonical/',
  },
  colorContrast: {
    title:
      'Deque axe rules: Elements must meet minimum color contrast ratio thresholds',
    url: 'https://dequeuniversity.com/rules/axe/4.13/color-contrast',
  },
  definitionList: {
    title:
      'Deque axe rules: dl elements must only directly contain properly-ordered dt and dd groups, script, template or div elements',
    url: 'https://dequeuniversity.com/rules/axe/4.13/definition-list',
  },
  dlitem: {
    title: 'Deque axe rules: dt and dd elements must be contained by a dl',
    url: 'https://dequeuniversity.com/rules/axe/4.13/dlitem',
  },
  documentTitle: {
    title:
      'Deque axe rules: Documents must have <title> element to aid in navigation',
    url: 'https://dequeuniversity.com/rules/axe/4.13/document-title',
  },
  duplicateIdAria: {
    title: 'Deque axe rules: IDs used in ARIA and labels must be unique',
    url: 'https://dequeuniversity.com/rules/axe/4.13/duplicate-id-aria',
  },
  formFieldMultipleLabels: {
    title: 'Deque axe rules: Form field must not have multiple label elements',
    url: 'https://dequeuniversity.com/rules/axe/4.13/form-field-multiple-labels',
  },
  frameTitle: {
    title: 'Deque axe rules: Frames must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/frame-title',
  },
  headingOrder: {
    title: 'Deque axe rules: Heading levels should only increase by one',
    url: 'https://dequeuniversity.com/rules/axe/4.13/heading-order',
  },
  hreflang: {
    title: "Lighthouse: Document doesn't have a valid hreflang",
    url: 'https://developer.chrome.com/docs/lighthouse/seo/hreflang/',
  },
  htmlHasLang: {
    title: 'Deque axe rules: <html> element must have a lang attribute',
    url: 'https://dequeuniversity.com/rules/axe/4.13/html-has-lang',
  },
  htmlLangValid: {
    title:
      'Deque axe rules: <html> element must have a valid value for the lang attribute',
    url: 'https://dequeuniversity.com/rules/axe/4.13/html-lang-valid',
  },
  htmlXmlLangMismatch: {
    title:
      'Deque axe rules: HTML elements with lang and xml:lang must have the same base language',
    url: 'https://dequeuniversity.com/rules/axe/4.13/html-xml-lang-mismatch',
  },
  httpStatusCode: {
    title: 'Lighthouse: Page has unsuccessful HTTP status code',
    url: 'https://developer.chrome.com/docs/lighthouse/seo/http-status-code/',
  },
  imageAlt: {
    title: 'Deque axe rules: Images must have alternative text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/image-alt',
  },
  inputButtonName: {
    title: 'Deque axe rules: Input buttons must have discernible text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/input-button-name',
  },
  inputImageAlt: {
    title: 'Deque axe rules: Image buttons must have alternative text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/input-image-alt',
  },
  isCrawlable: {
    title: 'Lighthouse: Page is blocked from indexing',
    url: 'https://developer.chrome.com/docs/lighthouse/seo/is-crawlable/',
  },
  label: {
    title: 'Deque axe rules: Form elements must have labels',
    url: 'https://dequeuniversity.com/rules/axe/4.13/label',
  },
  landmarkOneMain: {
    title: 'Deque axe rules: Document should have one main landmark',
    url: 'https://dequeuniversity.com/rules/axe/4.13/landmark-one-main',
  },
  linkInTextBlock: {
    title:
      'Deque axe rules: Links must be distinguishable without relying on color',
    url: 'https://dequeuniversity.com/rules/axe/4.13/link-in-text-block',
  },
  linkName: {
    title: 'Deque axe rules: Links must have discernible text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/link-name',
  },
  linkText: {
    title: 'Lighthouse: Links do not have descriptive text',
    url: 'https://developer.chrome.com/docs/lighthouse/seo/link-text/',
  },
  list: {
    title:
      'Deque axe rules: <ul> and <ol> must only directly contain <li>, <script> or <template> elements',
    url: 'https://dequeuniversity.com/rules/axe/4.13/list',
  },
  listitem: {
    title: 'Deque axe rules: <li> elements must be contained in a <ul> or <ol>',
    url: 'https://dequeuniversity.com/rules/axe/4.13/listitem',
  },
  metaDescription: {
    title: 'Lighthouse: Document does not have a meta description',
    url: 'https://developer.chrome.com/docs/lighthouse/seo/meta-description/',
  },
  metaRefresh: {
    title: 'Deque axe rules: Delayed refresh under 20 hours must not be used',
    url: 'https://dequeuniversity.com/rules/axe/4.13/meta-refresh',
  },
  metaViewport: {
    title: 'Deque axe rules: Zooming and scaling must not be disabled',
    url: 'https://dequeuniversity.com/rules/axe/4.13/meta-viewport',
  },
  objectAlt: {
    title: 'Deque axe rules: <object> elements must have alternative text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/object-alt',
  },
  presentationRoleConflict: {
    title:
      'Deque axe rules: Elements marked as presentational should be consistently ignored',
    url: 'https://dequeuniversity.com/rules/axe/4.13/presentation-role-conflict',
  },
  robotsTxt: {
    title: 'Lighthouse: robots.txt is not valid',
    url: 'https://developer.chrome.com/docs/lighthouse/seo/invalid-robots-txt/',
  },
  selectName: {
    title: 'Deque axe rules: Select element must have an accessible name',
    url: 'https://dequeuniversity.com/rules/axe/4.13/select-name',
  },
  skipLink: {
    title:
      'Deque axe rules: The skip-link target should exist and be focusable',
    url: 'https://dequeuniversity.com/rules/axe/4.13/skip-link',
  },
  svgImgAlt: {
    title:
      'Deque axe rules: <svg> elements with an img or image role must have alternative text',
    url: 'https://dequeuniversity.com/rules/axe/4.13/svg-img-alt',
  },
  tabindex: {
    title:
      'Deque axe rules: Elements should not have tabindex greater than zero',
    url: 'https://dequeuniversity.com/rules/axe/4.13/tabindex',
  },
  targetSize: {
    title:
      'Deque axe rules: All touch targets must be 24px large, or leave sufficient space',
    url: 'https://dequeuniversity.com/rules/axe/4.13/target-size',
  },
  tdHeadersAttr: {
    title:
      'Deque axe rules: Table cell headers attributes must refer to other <th> elements in the same table',
    url: 'https://dequeuniversity.com/rules/axe/4.13/td-headers-attr',
  },
  thHasDataCells: {
    title:
      'Deque axe rules: Table headers in a data table must refer to data cells',
    url: 'https://dequeuniversity.com/rules/axe/4.13/th-has-data-cells',
  },
  validLang: {
    title: 'Deque axe rules: lang attribute must have a valid value',
    url: 'https://dequeuniversity.com/rules/axe/4.13/valid-lang',
  },
  videoCaption: {
    title: 'Deque axe rules: <video> elements must have captions',
    url: 'https://dequeuniversity.com/rules/axe/4.13/video-caption',
  },
} as const satisfies Record<string, ISeoIssueSource>;

/**
 * Every audit Lighthouse scores in its SEO or accessibility category, as a finding the
 * PageSpeed worker writes from the mobile answer: a code per audit id, its weights as
 * Lighthouse's configuration gives them (`lighthouse-audits.fixture.json`), and the
 * severity `lighthouseSeverityOf` derives from its audit. SEO first, then accessibility,
 * each in the order Lighthouse lists its audits.
 *
 * Only the audits Lighthouse weighs in SEO are checks (`ACTIVE_LIGHTHOUSE_CODES`). The
 * accessibility ones are retired: the page shows Lighthouse's accessibility score as an
 * overview, and its audits are neither extracted, listed nor scored. Their entries stay so
 * a finding or verdict stored before still reads back, as a retired crawl check's does.
 *
 * The verdicts are Lighthouse's, not ours: where one of our checks looks at the same thing,
 * both are recorded and both count (lighthouse-checks D11), and `ISSUE_COUNTERPARTS`
 * puts them on one line of the screen.
 */
export const LIGHTHOUSE_CATALOGUE = {
  LH_IS_CRAWLABLE: {
    audit: 'is-crawlable',
    weights: { seo: 4.043 },
    severity: 'error',
    label: 'Page is blocked from all search engines',
    passLabel: 'Page is open to search engines',
    plain: {
      what: 'Search engines are told not to list this page at all',
      why: 'A page every search engine is told to skip earns no search traffic. On a post meant to be found this is almost always a leftover setting, such as a staging switch or a category rule applied too widely.',
      fix: 'Check the setting that hides this page or its category from search engines in your CMS or SEO plugin; if the block comes from the server or robots.txt, ask your developer to lift it.',
    },
    hint: 'Remove the noindex rule or robots.txt block that keeps every search engine away from this page.',
    explanation:
      "Lighthouse fails this check when a rule keeps every major search engine from indexing the page: noindex or none in a robots meta tag or an X-Robots-Tag header, an unavailable_after date that has passed, or a robots.txt rule that disallows the address. A rule aimed at one crawler only, such as googlebot, earns a warning instead of a failure. Google drops a noindexed page from its results and cannot read a page robots.txt blocks, so either way the page gets no search traffic. Some pages, such as legal notices, are meant to stay out; a blog post listed in the sitemap almost never is. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.isCrawlable, SOURCE.blockIndexing, SOURCE.robotsIntro],
  },
  LH_DOCUMENT_TITLE: {
    audit: 'document-title',
    weights: { seo: 1, accessibility: 7 },
    severity: 'notice',
    label: 'Title is missing or empty',
    passLabel: 'Title is present',
    plain: {
      what: "The page's title is missing or left blank",
      why: 'Google then writes the search headline itself, which often describes the page worse and earns fewer clicks. Screen reader users rely on the title to know which page they are on, and the browser tab shows nothing useful.',
      fix: 'The writer or editor can fill in the page title (often an "SEO title" field) in the CMS; if no page has one, ask your developer to add it to the theme template.',
    },
    hint: 'Give the page a title that says what this page is about.',
    explanation:
      "Lighthouse runs the axe accessibility rule for the page title: the page fails when it has no title element or the title is empty. Screen reader users rely on the title for an overview of a page, and it also names the browser tab and bookmark, so without one those visitors must read the page to learn what it is. Google uses the title as the main source for the headline of a search result and asks for a descriptive title on every page; without one it builds the headline from other text on the page. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.documentTitle, SOURCE.titleLinks],
  },
  LH_META_DESCRIPTION: {
    audit: 'meta-description',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'Meta description is missing or empty',
    passLabel: 'Meta description is present',
    plain: {
      what: "The page's search summary is missing or left blank",
      why: 'Google then picks a passage from the page to show under the headline, which may be out of context. The summary does not affect rankings, but a clear one can earn more clicks from the same position.',
      fix: 'The writer or editor can add a short, accurate summary of this page in the meta description field of the CMS or SEO plugin, written for this page alone.',
    },
    hint: 'Add a short meta description written for this page alone.',
    explanation:
      "Lighthouse checks only that the page has a meta description and that it is not empty; it does not judge the text. Google does not use the meta description for ranking, but may show it as the snippet under the headline when it describes the page better than a passage of the text, so a missing one leaves the snippet to chance. Google and Lighthouse both advise a unique, specific summary for each page, without keyword stuffing; clearly labelled facts can stand in for full sentences. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.metaDescription, SOURCE.snippets],
  },
  LH_HTTP_STATUS_CODE: {
    audit: 'http-status-code',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'Page answers with an error status',
    passLabel: 'Page answers with a success status',
    plain: {
      what: 'The server tells search engines this page is broken or missing',
      why: 'Search engines may not list a page that answers with an error, even when it shows content to visitors, so a live post sent this way can lose its search traffic.',
      fix: 'Ask your developer or hosting provider why the server sends an error code for this address; a page that has moved should redirect to its new address instead.',
    },
    hint: 'Make the page answer with a 200 status, or redirect it if it has moved.',
    explanation:
      "Lighthouse fails this check when the page answers with an HTTP status in the 400s or 500s, such as 404 Not Found or 503 Service Unavailable, whether or not the page shows content. Search engines read an error status as a sign that the page is missing or broken, and may not index it. Every valid page should answer with a status in the 200s, and a page that has moved should send a redirect, a permanent one if the move is permanent. A deliberate error page, such as the site's 404 page, is meant to fail and should stay out of search results. A 403 or 429 can also mean the server's bot protection turned Lighthouse away rather than visitors. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.httpStatusCode, SOURCE.redirects],
  },
  LH_LINK_TEXT: {
    audit: 'link-text',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'Links with generic text like "click here"',
    passLabel: 'Link text says where it leads',
    plain: {
      what: 'Some links say only "click here" or "learn more" instead of where they lead',
      why: 'Google reads link text to learn what the linked page is about, so generic words tell it nothing. Visitors scanning the page, and screen reader users moving through its list of links, cannot tell these links apart.',
      fix: 'The writer or editor can reword each link in the CMS so its words name what the reader gets, for example "our pricing guide" instead of "click here".',
    },
    hint: 'Replace "click here" and "learn more" with a few words that name the destination.',
    explanation:
      'Lighthouse flags links whose whole text is a generic phrase from its list, such as "click here", "here", "more" or "learn more", in English and a number of other languages; links to the same page, nofollow links and email links are not checked. Google uses link text to understand the page a link points to and asks for text that is descriptive, reasonably concise and relevant, so a generic phrase passes on nothing. Screen reader users often move through a page by its list of links, where a row of "learn more" says nothing about where each one goes. The fix is a few words that name the destination, rewording the sentence where needed. The verdict comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [
      LH_SOURCE.linkText,
      SOURCE.crawlableLinks,
      SOURCE.wcagLinkPurpose,
    ],
  },
  LH_CRAWLABLE_ANCHORS: {
    audit: 'crawlable-anchors',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'Links without a usable web address',
    passLabel: 'Links have usable web addresses',
    plain: {
      what: 'Some links on this page have no working address a search engine can follow',
      why: 'Search engines find pages by following link addresses. Where one of these links stands for a real page, that page is not discovered through it and gets no credit from the link.',
      fix: 'Ask your developer to give each link a real web address, and to build controls that only open menus or run scripts as buttons; the theme or a plugin is the usual source.',
    },
    hint: 'Give every link a real URL, and make controls that only run a script into buttons.',
    explanation:
      "Lighthouse flags links a crawler cannot follow: a link with an empty address, one written as javascript:void(0), one pointing to a file on someone's own computer (file:), one whose address cannot be read as a URL, and a link with no address at all that works only through a click script. Links given a role, email links and in-page targets are left alone. Google states that it can generally only follow a link whose href resolves to a real web address. Many flagged links are menu toggles or similar controls with no page behind them; those cost no search visibility, but building them as buttons also makes them clear to keyboard and screen reader users. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [SOURCE.crawlableLinks, SOURCE.javascriptSeo],
  },
  LH_ROBOTS_TXT: {
    audit: 'robots-txt',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'robots.txt is invalid or unreachable',
    passLabel: 'robots.txt is valid',
    plain: {
      what: "The site's robots.txt has mistakes, or the server failed to send it",
      why: 'Search engines may misread rules they cannot parse, crawling parts of the site meant to stay hidden or skipping parts meant to be found. If the file fails with a server error, Google temporarily treats the whole site as blocked.',
      fix: 'Ask your developer or hosting provider to correct the lines Lighthouse lists and make sure the file loads without a server error; if an SEO plugin writes the file, check its settings.',
    },
    hint: 'Fix the robots.txt lines Lighthouse lists and make sure the file loads without a server error.',
    explanation:
      "Lighthouse fetches the site's robots.txt and fails this check when the request ends in a server error (5xx) or a 429, when the fetch fails, or when any line breaks the format: an unknown directive, an allow or disallow rule before any user-agent line, a pattern that does not start with / or *, a $ anywhere but the end, or a sitemap line without a full address. A missing file (404) is not a failure: it simply means there are no rules. Crawlers may not understand rules written in a broken file, so lines meant to hide or open parts of the site may not work. Google documents that it temporarily treats a site whose robots.txt answers with a server error as fully blocked. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.robotsTxt, SOURCE.robotsSpec, SOURCE.robotsIntro],
  },
  LH_IMAGE_ALT: {
    audit: 'image-alt',
    weights: { seo: 1, accessibility: 10 },
    severity: 'notice',
    label: 'Images without alt text',
    passLabel: 'Images have alt text',
    plain: {
      what: 'Some images have no description for people who cannot see them',
      why: 'Visitors using screen readers hear nothing useful in their place, or just a file name, which is an accessibility failure that exposes the site to complaints. Google also uses this text to understand images for image search.',
      fix: 'The writer or editor can fill in the alt text field for each image in the CMS; for images built into the theme, ask your developer. Decorative images should be marked decorative.',
    },
    hint: 'Give each informative image short alt text, and mark decorative ones with an empty alt.',
    explanation:
      "Lighthouse runs the axe accessibility rule for images on the whole rendered page, theme included: an image fails when it has no text alternative, neither alt text nor a label given another way, and is not marked as decorative. Screen readers announce alt text in place of the image, and without it may read out the file name. Google calls alt text the most important attribute for image metadata and uses it, with the surrounding text, to understand images for image search. Informative images need short, specific descriptions; purely decorative ones should carry an empty alt so assistive technology skips them. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.imageAlt, SOURCE.images, SOURCE.waiImages],
  },
  LH_HREFLANG: {
    audit: 'hreflang',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'Hreflang has an invalid language code or URL',
    passLabel: 'Hreflang codes and URLs are valid',
    plain: {
      what: "The page's language-version links use an unknown language or an incomplete address",
      why: 'Google uses these links to show each searcher the version in their language or country. Links it cannot read may be ignored, and visitors may land on a version in the wrong language.',
      fix: 'Ask your developer, or check the multilingual plugin, to use valid language codes such as "en" or "en-GB" and full addresses starting with https:// in each link.',
    },
    hint: 'Use valid ISO language codes and full https:// URLs in every hreflang link.',
    explanation:
      "Lighthouse reads the hreflang links in the page's head and HTTP headers and fails the check when one uses a language code that is not a valid ISO 639-1 code (x-default is allowed), or an address that is relative rather than a full URL. It does not check region codes, sitemap annotations, or whether the other versions link back. Google uses hreflang to choose which language or regional version to show a searcher, requires valid codes and fully qualified URLs, and may ignore annotations that break these rules. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.hreflang, SOURCE.hreflang],
  },
  LH_CANONICAL: {
    audit: 'canonical',
    weights: { seo: 1 },
    severity: 'notice',
    label: 'Canonical URL is invalid or misdirected',
    passLabel: 'Canonical URL is valid',
    plain: {
      what: "The page's main-version link is broken, contradicts itself or points to the wrong page",
      why: 'This link tells Google which address to list. A broken or self-contradicting one is ignored, and one pointing to the homepage or another language version asks Google to show that page instead of this one.',
      fix: "Ask your developer, or check the SEO plugin settings, to keep a single main-version link written as a full address that names this page's own preferred URL.",
    },
    hint: "Keep one absolute canonical URL that names this page's own preferred address.",
    explanation:
      "Lighthouse checks the canonical link in the page's head or HTTP headers and fails it when the address is invalid or relative, when the page names more than one canonical, when a deeper page points to the homepage, or when it points to one of the page's other language versions. A page with no canonical is not judged. Google treats the canonical as a hint for which address to show in search results; a hint that is broken or contradicts itself cannot be followed, and one that names the homepage or a translation asks Google to show that page in place of this one. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.canonical, SOURCE.canonical],
  },
  LH_ACCESSKEYS: {
    audit: 'accesskeys',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Keyboard shortcut keys used twice',
    passLabel: 'Keyboard shortcut keys are unique',
    plain: {
      what: 'Two or more keyboard shortcuts on this page are set to the same key',
      why: 'Visitors who move around by keyboard, often because they cannot use a mouse or see the screen, press a shortcut and land somewhere unexpected or never reach the second target. Accessibility guidelines count this as a barrier.',
      fix: 'Ask your developer to give each shortcut its own key in the theme, or to drop the custom shortcuts altogether, since they can clash with browser and screen reader keys.',
    },
    hint: 'Give every accesskey a unique value, or remove access keys from the template.',
    explanation:
      "Lighthouse checks that no two elements on the page share the same accesskey value. An access key lets a visitor jump to or activate an element with a key combination, usually with Alt; when two elements share a key, the browser picks one or behaves unpredictably, and keyboard users with no or low vision lose the shortcut. Deque, whose axe rules Lighthouse runs, recommends avoiding access keys entirely: browsers support them unevenly, visitors rarely know they exist, and they can override the browser's own shortcuts. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.accesskeys],
  },
  LH_ARIA_ALLOWED_ATTR: {
    audit: 'aria-allowed-attr',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: "Screen reader details that don't fit the element",
    passLabel: 'Screen reader details fit their elements',
    plain: {
      what: "Some parts of the page carry screen reader details that don't apply to them",
      why: 'Screen readers disregard details that do not belong on that kind of element, so a visitor who listens to the page can miss a state such as selected or expanded that sighted visitors can see.',
      fix: 'Ask your developer to remove the details that do not fit, or move them to an element that supports them; the code is usually in the theme or a plugin rather than the post.',
    },
    hint: 'Use only the aria-* attributes that the element’s role supports.',
    explanation:
      "Each kind of element, whether a native one or one given an ARIA role, supports a defined set of aria-* attributes, and Lighthouse checks that every one used on the page is allowed for its element. An attribute used where it is not supported is invalid, so screen readers do not pass it on and visitors who rely on them lose the information it was meant to carry. The fix is to remove it, change the role to one that supports it, or move it to the right element. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaAllowedAttr],
  },
  LH_ARIA_COMMAND_NAME: {
    audit: 'aria-command-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Custom links and menu items without a name',
    passLabel: 'Custom links and menu items have names',
    plain: {
      what: 'Some custom links and menu items give screen reader users no clue where they go',
      why: 'A screen reader announces them only by a generic name, such as "link" or "menu item", so a visitor who cannot see the screen cannot tell where they lead or what they do, and may abandon the menu or the action.',
      fix: 'Ask your developer to give each one visible text or a hidden label, in the theme or plugin that builds it, saying where it goes or what it does.',
    },
    hint: 'Give every element with role link, button or menuitem text, an aria-label or an aria-labelledby that points at real text.',
    explanation:
      "Lighthouse checks elements that are made to act as a link, button or menu item through an ARIA role, rather than built as real links and buttons, and fails any without an accessible name: no inner text, an empty aria-label, or an aria-labelledby that points at nothing. A screen reader then announces only the element's type, which makes it unusable for visitors who rely on one. Visible text, a non-empty aria-label or an aria-labelledby pointing at text fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaCommandName],
  },
  LH_ARIA_CONDITIONAL_ATTR: {
    audit: 'aria-conditional-attr',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Checkbox or row states set where not allowed',
    passLabel: 'Checkbox and row states are set where allowed',
    plain: {
      what: 'Some checkboxes or table rows report their state to screen readers in a way not allowed there',
      why: 'Screen readers handle these clashing signals unpredictably: a visitor may hear the wrong ticked state for a checkbox, or miss that a row opens. People who rely on audio get a confusing, unreliable page.',
      fix: 'Ask your developer to let real checkboxes report their own ticked state, and to use a table type built for expandable rows where rows open and close, in the theme or plugin code.',
    },
    hint: 'Drop aria-checked from native checkboxes, and use row attributes like aria-expanded only inside a treegrid.',
    explanation:
      "Some ARIA attributes are allowed on an element only under certain conditions, and Lighthouse checks that those conditions hold. The usual failures are aria-checked on a native HTML checkbox, which competes with the browser’s own checked state, and attributes such as aria-expanded or aria-level on table rows outside a treegrid. Assistive technology then behaves unpredictably. The fix is to rely on the native checkbox state, or replace it with a fully keyboard-accessible custom control, and to make the table a treegrid when the row attributes are needed. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaConditionalAttr],
  },
  LH_ARIA_DEPRECATED_ROLE: {
    audit: 'aria-deprecated-role',
    weights: { accessibility: 1 },
    severity: 'notice',
    label: 'Retired element types screen readers may not know',
    passLabel: 'No retired element types',
    plain: {
      what: 'Some parts of the page describe themselves with a retired term screen readers may not know',
      why: 'Screen readers and other assistive tools may not recognise a retired term, so a visitor listening to the page can lose the structure that part was meant to convey. The effect is limited, which is why this is a notice.',
      fix: 'Ask your developer to replace the retired term with a current one, such as a list or a section, in the theme or plugin that outputs it.',
    },
    hint: 'Replace deprecated ARIA roles, such as directory, with a current role or native element.',
    explanation:
      "Lighthouse checks that no element uses an ARIA role that the ARIA specification has deprecated, such as directory. Deprecated roles may not be processed correctly by screen readers and other assistive technology, so the information they were meant to convey can be lost. Deque suggests section, list or tree in place of directory, depending on how it was used. Lighthouse gives this check little weight in its accessibility score. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaDeprecatedRole],
  },
  LH_ARIA_DIALOG_NAME: {
    audit: 'aria-dialog-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Pop-ups without a title for screen readers',
    passLabel: 'Pop-ups have a title for screen readers',
    plain: {
      what: 'Pop-ups on this page open without a title that screen readers can announce',
      why: 'When a pop-up such as a sign-up form or cookie notice opens, a visitor using a screen reader hears no title and cannot tell what it is for before deciding how to respond to it.',
      fix: 'Ask your developer, or the vendor of the pop-up plugin, to give each pop-up a name, usually by linking it to its visible heading.',
    },
    hint: 'Name every dialog and alertdialog with aria-labelledby pointing at its heading, or with aria-label.',
    explanation:
      "Lighthouse checks that every element marked as a dialog or alert dialog, the usual build of modal pop-ups, has an accessible name. Without one, screen reader users may not be able to tell the purpose of the window that has just opened over the page. Pointing aria-labelledby at the pop-up’s visible heading, or adding an aria-label, fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaDialogName],
  },
  LH_ARIA_HIDDEN_BODY: {
    audit: 'aria-hidden-body',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Whole page hidden from screen readers',
    passLabel: 'Page is visible to screen readers',
    plain: {
      what: 'The entire page is marked as invisible to screen readers',
      why: 'Screen readers then behave inconsistently and may skip the content entirely, so visitors who are blind can be shut out of the page. Lighthouse counts this among its most heavily weighted accessibility checks.',
      fix: 'Ask your developer to find the theme or plugin script that hides the whole page and remove that setting, hiding only the specific parts screen readers should skip.',
    },
    hint: 'Remove aria-hidden="true" from the body element.',
    explanation:
      'Lighthouse checks that aria-hidden="true" is not set on the page’s body element. That setting removes the whole page from what assistive technology can read, and screen readers then work inconsistently: some read nothing, while keyboard users can still tab to links the screen reader stays silent about. Hiding should apply only to specific redundant parts, such as an inactive dialog or a collapsed menu. Removing the setting from the body fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [LH_SOURCE.ariaHiddenBody],
  },
  LH_ARIA_HIDDEN_FOCUS: {
    audit: 'aria-hidden-focus',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Hidden parts that keyboard users can still reach',
    passLabel: 'Hidden parts are out of keyboard reach',
    plain: {
      what: 'Keyboard users can land on links or buttons that screen readers are told to ignore',
      why: 'A visitor tabbing through the page stops on something the screen reader says nothing about, such as a link in an off-screen panel, so they cannot tell where they are or what will happen if they press it.',
      fix: 'Ask your developer to make hidden parts unreachable by keyboard too, or stop hiding them from screen readers if visitors are meant to use them; the change belongs in the theme or plugin.',
    },
    hint: 'Inside an aria-hidden="true" container, make every focusable element unfocusable or disabled.',
    explanation:
      'Lighthouse checks that no element marked aria-hidden="true" contains anything a keyboard can focus, such as a link, a form field or an element given a tabindex. Hiding removes the element and everything inside it from assistive technology, yet the keyboard still stops there, and the screen reader stays silent. Hidden content should also be hidden with CSS, given tabindex="-1" or disabled; setting aria-hidden="false" lower down does not undo a hidden ancestor. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [LH_SOURCE.ariaHiddenFocus],
  },
  LH_ARIA_INPUT_FIELD_NAME: {
    audit: 'aria-input-field-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Custom form fields without a label',
    passLabel: 'Custom form fields have labels',
    plain: {
      what: 'Some custom form fields, such as search boxes or sliders, have no label for screen readers',
      why: 'A visitor using a screen reader hears only a generic field type, with no name, and cannot tell what to type or pick. Forms they cannot complete mean lost searches, sign-ups and enquiries from those visitors.',
      fix: 'Ask your developer to give each field a label, ideally linked to the visible text beside it, in the theme or the form plugin that builds it.',
    },
    hint: 'Give every custom combobox, listbox, searchbox, slider, spinbutton or textbox an aria-label or aria-labelledby.',
    explanation:
      "Lighthouse checks custom input fields built with ARIA roles, such as combobox, listbox, searchbox, slider, spinbutton and textbox, and fails any without an accessible name, including an aria-labelledby that points at an element that doesn't exist. Screen readers then announce such a field with only a generic name, which makes it unusable for visitors who rely on them. An aria-label or an aria-labelledby pointing at visible label text fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaInputFieldName],
  },
  LH_ARIA_METER_NAME: {
    audit: 'aria-meter-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Gauges without a name',
    passLabel: 'Gauges have names',
    plain: {
      what: 'Gauges such as scores or levels are read aloud without saying what they measure',
      why: 'A visitor using a screen reader hears a value with no context, a number without knowing what it refers to, so the information the gauge shows visually is lost to them.',
      fix: 'Ask your developer to label each gauge, naming what it measures, in the theme or the plugin that draws it.',
    },
    hint: 'Give every element with role meter an aria-label, aria-labelledby or title.',
    explanation:
      "Lighthouse checks that every element marked as a meter, a gauge showing a value within a known range, has an accessible name. Without one a screen reader announces it with a generic name, which makes it unusable for visitors who rely on screen readers. An aria-label, an aria-labelledby pointing at visible text, or a title fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaMeterName],
  },
  LH_ARIA_PROGRESSBAR_NAME: {
    audit: 'aria-progressbar-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Progress bars without a name',
    passLabel: 'Progress bars have names',
    plain: {
      what: 'Progress bars are announced without saying what is loading or advancing',
      why: 'A visitor using a screen reader hears that something is in progress but not what, so they cannot tell whether to wait for a page section, an upload or a form step.',
      fix: 'Ask your developer to name each progress bar after the task it tracks, in the theme or the plugin that shows it.',
    },
    hint: 'Give every element with role progressbar an aria-label, aria-labelledby or title.',
    explanation:
      "Lighthouse checks that every element marked as a progress bar has an accessible name. Without one a screen reader announces it with a generic name, which makes it unusable for visitors who rely on screen readers: they hear progress but not what is progressing. An aria-label, an aria-labelledby pointing at visible text, or a title fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaProgressbarName],
  },
  LH_ARIA_PROHIBITED_ATTR: {
    audit: 'aria-prohibited-attr',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Labels placed where screen readers ignore them',
    passLabel: 'Labels sit where screen readers read them',
    plain: {
      what: 'Some labels are attached to parts of the page where screen readers will not read them',
      why: 'Information meant for visitors who listen to the page, such as a label on an icon or on a plain block of text, never reaches them, and screen readers may try to make up for it in inconsistent, confusing ways.',
      fix: 'Ask your developer to show that information as text on the page, or move it to an element that supports it, in the theme or plugin that outputs it.',
    },
    hint: 'Remove aria-* attributes that are prohibited on the element’s role, or move the information to visible text.',
    explanation:
      "Lighthouse checks that no element uses an ARIA attribute the ARIA specification prohibits for its role; the common case is aria-label or aria-labelledby on a plain element with no role, or on roles such as presentation, none, code or strong. Assistive technology ignores such attributes, or compensates inconsistently, so the information is not conveyed. The fix is to change the role, provide the information as text on the page, or move the attribute to an element that supports it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaProhibitedAttr],
  },
  LH_ARIA_REQUIRED_ATTR: {
    audit: 'aria-required-attr',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: "Custom controls that don't report their state",
    passLabel: 'Custom controls report their state',
    plain: {
      what: "Some custom controls don't tell screen readers their current state",
      why: 'A visitor using a screen reader cannot hear whether an option is ticked or where a slider sits, so they operate the control without knowing its state and may choose the wrong thing.',
      fix: 'Ask your developer to add the missing state, such as checked or the current value, to each control in the theme or plugin code.',
    },
    hint: 'Add the aria-* states and properties that each role requires, such as aria-checked on a checkbox role.',
    explanation:
      "Some ARIA roles require attributes that describe the element’s state, such as aria-checked for a custom checkbox or the current value for a slider, and Lighthouse checks that each element with such a role has them. When a required attribute is missing, the state of the control is not communicated to screen reader users. Adding the missing state or property fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaRequiredAttr],
  },
  LH_ARIA_REQUIRED_CHILDREN: {
    audit: 'aria-required-children',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Menus and lists missing their marked items',
    passLabel: 'Menus and lists contain their items',
    plain: {
      what: "Some custom menus or lists don't mark their entries in a way screen readers recognise",
      why: 'A screen reader announces the menu or list but cannot find the entries inside it, so a visitor listening to the page may not hear how many there are or be able to move between them.',
      fix: 'Ask your developer to mark each entry with the matching item type, such as menu item or tab, inside its container in the theme or plugin.',
    },
    hint: 'Give every container role, such as menu, list or tablist, the child roles it requires.',
    explanation:
      "Some ARIA roles are containers that must hold particular child roles: a menu needs menu items, a tablist needs tabs, a list needs list items. Lighthouse checks that every such container has its required children. Without them the container cannot perform its intended accessibility function, and screen reader users lose the structure and navigation it should give them. Adding the right child roles, or linking children with aria-owns where the code order differs, fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaRequiredChildren],
  },
  LH_ARIA_REQUIRED_PARENT: {
    audit: 'aria-required-parent',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Menu or list items outside their group',
    passLabel: 'Menu and list items sit in their group',
    plain: {
      what: 'Some menu entries, tabs or list items sit outside the group they belong to',
      why: 'Screen readers rely on that group to say where an item belongs, such as which menu or tab set it is part of, so visitors listening to the page lose their bearings and the item may not work as intended.',
      fix: 'Ask your developer to place each item inside its proper container, such as a menu or tab list, in the theme or plugin that builds it.',
    },
    hint: 'Place every child role, such as menuitem, tab or listitem, inside the parent role it requires.',
    explanation:
      "Some ARIA roles only make sense inside a particular parent: a menu item inside a menu, a tab inside a tablist, a tree item inside a tree. Lighthouse checks that every such element sits inside its required parent. Without it, assistive technology cannot convey where the item belongs and cannot function as the developer intended. Wrapping items in the right parent, or linking them with aria-owns where the code order differs, fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaRequiredParent],
  },
  LH_ARIA_ROLES: {
    audit: 'aria-roles',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Unrecognised element types in the code',
    passLabel: 'Element types are recognised',
    plain: {
      what: "Some parts of the page are labelled with a type screen readers don't recognise",
      why: 'Those parts lose the meaning the developer intended, so a visitor using a screen reader may not learn that something is a button, a menu or a region, and may not be able to use it.',
      fix: 'Ask your developer to correct the misspelled or invented type names in the theme or plugin code, using only the standard ones.',
    },
    hint: 'Use only valid, non-abstract ARIA role values, checked for spelling.',
    explanation:
      "Lighthouse checks that every role value on the page is a valid ARIA role. A misspelled or invented role is not understood by assistive technology, so the element cannot perform its intended accessibility function and screen reader users may not learn what it is or how to use it. Correcting the value to a valid role, or using the matching native HTML element, fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaRoles],
  },
  LH_ARIA_TEXT: {
    audit: 'aria-text',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Silent tab stops inside grouped text',
    passLabel: 'No silent tab stops in grouped text',
    plain: {
      what: 'A link or button is tucked inside text that screen readers read as one phrase',
      why: 'Keyboard users can still move to that link or button, but the screen reader says nothing about it, leaving an empty stop where an action should be announced. It mainly affects visitors on Apple VoiceOver.',
      fix: 'Ask your developer to move the link or button out of the grouped text, or remove the grouping, in the theme or plugin code.',
    },
    hint: 'Keep focusable elements out of anything marked role="text".',
    explanation:
      'Wrapping a phrase that is split by markup in role="text" makes VoiceOver read it as one phrase, but it also turns everything inside into plain text. Lighthouse checks that such an element contains nothing focusable: a link or button inside it can still be reached by keyboard, yet its name, role and value are not announced, creating an empty tab stop. Moving the focusable element out, or dropping role="text", fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [LH_SOURCE.ariaText],
  },
  LH_ARIA_TOGGLE_FIELD_NAME: {
    audit: 'aria-toggle-field-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Checkboxes and switches without a label',
    passLabel: 'Checkboxes and switches have labels',
    plain: {
      what: 'Screen reader users cannot tell what some checkboxes, options or on/off switches are for',
      why: 'They hear only "checkbox" or "switch" with no name, so a visitor who listens to the page cannot tell what they are agreeing to or turning on, and may skip a form or choose the wrong setting.',
      fix: 'Ask your developer to give each checkbox, option and switch a label, ideally linked to its visible text, in the theme or the form plugin.',
    },
    hint: 'Give every custom checkbox, radio, switch or menu checkbox or radio an accessible name.',
    explanation:
      "Lighthouse checks custom toggle controls built with ARIA roles, such as checkbox, radio, switch, menuitemcheckbox and menuitemradio, and fails any without an accessible name. Screen readers then announce the control with only a generic name, which makes it unusable for visitors who rely on them. Inner text, an aria-label, an aria-labelledby pointing at existing text, or a title fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaToggleFieldName],
  },
  LH_ARIA_TOOLTIP_NAME: {
    audit: 'aria-tooltip-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Tooltips with no text for screen readers',
    passLabel: 'Tooltips have text for screen readers',
    plain: {
      what: 'Some tooltips give screen readers nothing to read out',
      why: 'When a tooltip explains an icon or a field, a visitor using a screen reader hears no explanation and misses help that sighted visitors get by hovering.',
      fix: 'Ask your developer to put the tooltip text inside it, or link it to visible text, in the theme or plugin that shows it.',
    },
    hint: 'Give every element with role tooltip text content, an aria-label or aria-labelledby.',
    explanation:
      "Lighthouse checks that every element marked as a tooltip has an accessible name. Without one a screen reader announces it with a generic name, which makes it unusable for visitors who rely on screen readers, and the explanation it carries is lost to them. Text inside the tooltip, an aria-label, or an aria-labelledby pointing at existing text fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaTooltipName],
  },
  LH_ARIA_TREEITEM_NAME: {
    audit: 'aria-treeitem-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Unnamed entries in expandable tree menus',
    passLabel: 'Tree menu entries have names',
    plain: {
      what: 'Entries in folder-style, expandable menus are unnamed for screen reader users',
      why: 'A visitor using a screen reader hears unnamed entries as they move through the menu, so they cannot tell one category or section from another and may not find what they came for.',
      fix: 'Ask your developer to give each entry in the tree menu readable text or a hidden label in the theme or plugin that builds it.',
    },
    hint: 'Give every element with role treeitem text content, an aria-label or aria-labelledby.',
    explanation:
      "A tree is a nested, expandable list, like a folder view or a category menu, and Lighthouse checks that each of its items has an accessible name. Without one a screen reader announces the item with a generic name, which makes the tree unusable for visitors who rely on screen readers. Text inside the item, an aria-label, or an aria-labelledby pointing at existing text fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaTreeitemName],
  },
  LH_ARIA_VALID_ATTR_VALUE: {
    audit: 'aria-valid-attr-value',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Screen reader instructions with invalid values',
    passLabel: 'Screen reader instructions have valid values',
    plain: {
      what: 'Some instructions meant for screen readers contain values that are not allowed',
      why: 'Screen readers cannot interpret a value they do not recognise, for example an open-or-closed setting given "yes" instead of true, so visitors listening to the page miss what that part is doing.',
      fix: 'Ask your developer to correct each value in the theme or plugin code to one the standard allows, such as true or false.',
    },
    hint: 'Set every aria-* attribute to a value its specification allows.',
    explanation:
      "Every ARIA attribute accepts only certain values: true or false, a number, a token from a fixed list, or the id of another element. Lighthouse checks that each aria-* attribute on the page holds a valid value. Assistive technology cannot interpret an invalid one, so screen reader users do not get the state or relation it was meant to convey. Correcting the value fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaValidAttrValue],
  },
  LH_ARIA_VALID_ATTR: {
    audit: 'aria-valid-attr',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Misspelled screen reader instructions',
    passLabel: 'Screen reader instructions are spelled right',
    plain: {
      what: 'Some instructions meant for screen readers are misspelled or made up',
      why: 'Screen readers ignore an instruction whose name they do not recognise, so the label, state or description intended for visitors who listen to the page never reaches them.',
      fix: 'Ask your developer to correct the misspelled names in the theme or plugin code, checking each against the standard list.',
    },
    hint: 'Check every aria-* attribute name against the specification and fix misspellings.',
    explanation:
      "Lighthouse checks that every attribute starting with aria- is a real ARIA attribute name. A misspelled or invented one, such as aria-labeledby for aria-labelledby, is not understood by assistive technology, so screen reader users do not get the label, state or relation it was meant to provide. Correcting the spelling fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.ariaValidAttr],
  },
  LH_BUTTON_NAME: {
    audit: 'button-name',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Buttons without a name',
    passLabel: 'Buttons have names',
    plain: {
      what: 'Some buttons are announced to screen reader users as just "button"',
      why: 'A visitor who cannot see the screen cannot tell whether a button opens a menu, submits a form or closes a pop-up, so they may avoid it, and actions such as sign-ups and searches go unused.',
      fix: 'Ask your developer to give icon-only buttons a hidden label in the theme or plugin; for buttons added in the CMS, the editor can fill in their button text.',
    },
    hint: 'Give every button visible text, or an aria-label when it shows only an icon.',
    explanation:
      'Lighthouse checks that every button, native or marked with the button role, has an accessible name: visible text, an aria-label, an aria-labelledby pointing at text, or a title. Icon-only buttons, like a search magnifier or a menu toggle, are the usual failures. Without a name a screen reader announces only "button", which makes it unusable for visitors who rely on one. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [LH_SOURCE.buttonName],
  },
  LH_BYPASS: {
    audit: 'bypass',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'No way to skip to the main content',
    passLabel: 'There is a way to skip to the main content',
    plain: {
      what: "Keyboard users can't jump past the header and menu straight to the article",
      why: 'Visitors who navigate by keyboard must tab through every header and menu link on each page before they reach the content. That is slow and tiring, and for people with motor impairments it can take minutes.',
      fix: 'Ask your developer to mark the main content area in the theme and add a "Skip to content" link at the top; clear headings in the post written by the editor also help.',
    },
    hint: 'Add a main landmark, a skip link or headings so keyboard users can bypass repeated blocks.',
    explanation:
      "Lighthouse checks that the page offers at least one way to bypass repeated content such as the header and navigation: a heading, a skip link or a landmark region. Keyboard-only visitors otherwise have to tab through every link in the header and menu on every page, which Deque notes can take minutes and cause fatigue for people with severe motor limitations. A single main element around the content, plus a skip link, is the usual fix. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.bypass],
  },
  LH_COLOR_CONTRAST: {
    audit: 'color-contrast',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Text with too little contrast',
    passLabel: 'Text has enough contrast',
    plain: {
      what: 'Some text is too faint against its background to read easily',
      why: 'Visitors with low vision, and many others, find low-contrast text hard or impossible to read, so they skip it or leave. It also falls short of the contrast minimum in the accessibility guidelines a site is measured against.',
      fix: 'Ask your developer or designer to darken the text or change the background in the theme until contrast meets the guideline; text colours set by hand in the editor need the same check.',
    },
    hint: 'Raise contrast to at least 4.5:1 for normal text and 3:1 for large text.',
    explanation:
      "Lighthouse checks the contrast between each piece of text and the colour behind it against the WCAG minimum: at least 4.5:1 for normal text and 3:1 for large text, which is 24 CSS pixels, or about 19 pixels when bold. Low-contrast text is difficult or impossible for many people to read, especially those with low vision. Darker text, a lighter background, or larger and bolder type fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.colorContrast],
  },
  LH_DEFINITION_LIST: {
    audit: 'definition-list',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Term-and-definition lists built out of order',
    passLabel: 'Term-and-definition lists are built in order',
    plain: {
      what: 'A list of terms and their meanings is built in a way screen readers misread',
      why: 'A screen reader may read a glossary or term list out in a confusing or inaccurate way, so a visitor listening to the page cannot tell which description belongs to which term.',
      fix: 'Ask your developer to rebuild the list in the theme, plugin or the post’s code so it holds only terms and their descriptions, in order.',
    },
    hint: 'Let each dl contain only dt and dd groups in order, plus script, template or div wrappers.',
    explanation:
      "A definition list pairs terms with their descriptions, and HTML allows it to contain only terms and descriptions in order, optionally grouped in div elements, plus script and template elements. Lighthouse checks every definition list for anything else, or for descriptions before their terms. A list built wrongly can make screen readers produce confusing or inaccurate output. Removing the stray elements and putting each term before its description fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.definitionList],
  },
  LH_DLITEM: {
    audit: 'dlitem',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Terms and definitions outside a list',
    passLabel: 'Terms and definitions sit in a list',
    plain: {
      what: 'Terms and their meanings appear outside the list that should hold them',
      why: 'Screen readers cannot announce them as a term and its description, so visitors who listen to the page hear loose fragments and lose how the pieces relate.',
      fix: "Ask your developer to wrap the terms and descriptions in a definition list in the theme or plugin, or in the post's code view if the editor pasted them in.",
    },
    hint: 'Wrap every dt and dd element in a parent dl.',
    explanation:
      "Terms (dt) and their descriptions (dd) have meaning only inside a definition list (dl). Lighthouse checks that every dt and dd element sits in one, so that screen readers can announce the pairs properly. Outside a list they are read as disconnected text. Wrapping them in a dl element fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.dlitem],
  },
  LH_DUPLICATE_ID_ARIA: {
    audit: 'duplicate-id-aria',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Labels that point to a duplicated reference',
    passLabel: 'Label references are unique',
    plain: {
      what: 'Labels on this page point to a reference that appears twice, so one copy is overlooked',
      why: 'Screen readers usually follow only the first match, so a form field or control whose label points to the second copy may be announced with the wrong text or none, and visitors may fill in the wrong field.',
      fix: 'Ask your developer to give every referenced element its own unique id in the theme or plugin; duplicates can appear when the same form or widget is placed twice on a page.',
    },
    hint: 'Make every id referenced by ARIA attributes or label elements unique on the page.',
    explanation:
      "Labels and ARIA relationships, such as aria-labelledby and aria-describedby, point at other elements by their id. Lighthouse checks that every id used this way appears only once on the page. When an id is duplicated, assistive technology typically uses only the first element, so the second instance is overlooked and labels for form fields or controls break. Renaming duplicates so each is unique fixes it. Google does not use this as a ranking signal; it is an accessibility check. The verdict comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.duplicateIdAria],
  },
  LH_FORM_FIELD_MULTIPLE_LABELS: {
    audit: 'form-field-multiple-labels',
    weights: { accessibility: 3 },
    severity: 'notice',
    label: 'Form fields with more than one label',
    passLabel: 'Form fields have one label each',
    plain: {
      what: 'Some form fields carry two or more labels, so screen readers may read out the wrong one',
      why: 'Screen readers handle a field with several labels inconsistently: some read the first, some the last, some all of them. Visitors who rely on them may misread what the field asks for, and the form falls short of accessibility guidelines.',
      fix: 'Ask your developer to give each form field a single label, merging any extra wording into it; if the form comes from a plugin, check its label settings first.',
    },
    hint: 'Give each form field exactly one label.',
    explanation:
      "Lighthouse flags form fields that have more than one label tied to them. Screen reader and browser combinations disagree about which one to announce — the first, the last or all of them — so a visitor may hear the wrong instruction. Keeping one label per field removes the ambiguity; Deque maps the rule to WCAG 2.2 success criterion 3.3.2 (Labels or Instructions). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.formFieldMultipleLabels],
  },
  LH_FRAME_TITLE: {
    audit: 'frame-title',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Embedded frames without a title',
    passLabel: 'Embedded frames have titles',
    plain: {
      what: 'Embedded content such as videos, maps or forms has no name a screen reader can announce',
      why: 'Where a video, map or form is embedded, screen reader users hear only "frame", a file name or a web address, so they can\'t tell what it is or whether it\'s worth entering. The page also falls short of accessibility guidelines.',
      fix: 'Ask your developer, or the editor who pasted the embed code into the CMS, to add a short title to each embed that says what it is, such as "Map of our Toronto office".',
    },
    hint: 'Give every embedded frame a short title describing its content.',
    explanation:
      "Lighthouse checks that every frame and iframe on the page — the containers used for embedded videos, maps, forms and widgets — has a title or other accessible name. Screen reader users can pull up a list of a page's frames by title to find the one they need; without one, the screen reader falls back to the word \"frame\", the file name or the URL. A short, unique title on each embed fixes it, and Deque maps the rule to WCAG 2.2 success criterion 4.1.2 (Name, Role, Value). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.frameTitle],
  },
  LH_HEADING_ORDER: {
    audit: 'heading-order',
    weights: { accessibility: 3 },
    severity: 'notice',
    label: 'Heading levels out of sequence',
    passLabel: 'Heading levels in sequence',
    plain: {
      what: 'Headings jump down more than one level at a time, which confuses screen reader navigation',
      why: "This does not affect Google rankings: Google says heading order doesn't matter to Search. It matters to screen reader users, who move through a page by its headings and read a skipped level as a missing section.",
      fix: 'The editor can pick heading levels in order in the CMS — a Heading 3 only under a Heading 2 — and ask the developer to fix any headings in the theme that were chosen for their size rather than their level.',
    },
    hint: 'Step heading levels down one at a time; style their size separately.',
    explanation:
      "Lighthouse checks that heading levels only increase by one as the page goes down — a level-2 heading followed directly by a level-4 fails. Screen reader users skim a page by its headings, so a skipped level suggests a section that isn't there; Deque lists the rule as a best practice. Google's SEO Starter Guide says headings in semantic order are fantastic for screen readers but that, from Google Search's perspective, it doesn't matter if they are out of order, so this is an accessibility fix, not a ranking one. Choosing the next level down, and setting a heading's size through styles instead of its level, fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.headingOrder, SOURCE.starterGuide],
  },
  LH_HTML_HAS_LANG: {
    audit: 'html-has-lang',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Page language is not set',
    passLabel: 'Page language is set',
    plain: {
      what: "Screen readers aren't told the page's language, so they may read it in the wrong accent",
      why: 'This does not affect Google rankings: Google detects the language from the visible text. A screen reader set to another language will read the page with the wrong pronunciation, and accessibility standards require the language to be declared.',
      fix: "Ask your developer to set the site's language once in the theme's page template, or in the CMS's language setting, so every page declares it.",
    },
    hint: 'Declare the page language once in the site template.',
    explanation:
      "Lighthouse checks that the page's html element carries a lang attribute. Without it, a screen reader assumes the language its user chose during setup, so a visitor whose reader is set to French hears English text with French pronunciation. Google states that it uses the visible content to determine a page's language and does not use lang attributes, so this does not affect Google rankings; it is still required by WCAG 2.2 success criterion 3.1.1 (Language of Page). Declaring the language once in the site template fixes every page. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.htmlHasLang, SOURCE.wcagLanguage, SOURCE.multiRegional],
  },
  LH_HTML_LANG_VALID: {
    audit: 'html-lang-valid',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Page language code is not valid',
    passLabel: 'Page language code is valid',
    plain: {
      what: "The page names its language with a code that screen readers don't recognise",
      why: "This does not affect Google rankings, as Google reads the language from the text. Screen readers can't switch to the right voice for an unknown code, so visitors who use them may hear the whole page mispronounced.",
      fix: 'Ask your developer to correct the language code in the theme template or the CMS language setting to a standard one, such as en, or en-CA for Canadian English.',
    },
    hint: 'Use a standard language code such as en or en-CA for the page.',
    explanation:
      "Lighthouse checks that the lang attribute on the page's html element holds a valid BCP 47 language tag, such as en or fr-CA. Screen readers choose a pronunciation library by this code, so a misspelt or invented value leaves them on their default voice. Google does not use lang attributes to determine a page's language, so this does not affect Google rankings, but a valid value is part of WCAG 2.2 success criterion 3.1.1 (Language of Page). Replacing the value with a standard tag fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [
      LH_SOURCE.htmlLangValid,
      SOURCE.wcagLanguage,
      SOURCE.multiRegional,
    ],
  },
  LH_HTML_XML_LANG_MISMATCH: {
    audit: 'html-xml-lang-mismatch',
    weights: { accessibility: 3 },
    severity: 'notice',
    label: 'Two language declarations disagree',
    passLabel: 'Language declarations agree',
    plain: {
      what: 'The page states its language twice, and the two statements name different languages',
      why: 'This does not affect Google rankings, as Google reads the language from the text. Screen readers may follow the wrong statement and read the page with the wrong pronunciation, which hurts visitors who rely on them.',
      fix: "Ask your developer to make the page's two language settings in the theme template name the same language.",
    },
    hint: 'Make lang and xml:lang name the same language.',
    explanation:
      "Lighthouse checks that when the page's html element carries both lang and xml:lang, the two name the same base language — en and en-GB agree, en and fr do not. A mismatch leaves screen readers unsure which language to read the page in; Deque maps the rule to WCAG 2.2 success criterion 3.1.1 (Language of Page). Google determines language from the visible text and does not use code-level language information, so this does not affect Google rankings. Making the two values match fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [
      LH_SOURCE.htmlXmlLangMismatch,
      SOURCE.wcagLanguage,
      SOURCE.multiRegional,
    ],
  },
  LH_INPUT_BUTTON_NAME: {
    audit: 'input-button-name',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Form buttons with no text',
    passLabel: 'Form buttons have text',
    plain: {
      what: 'Some form buttons have no words, so screen readers cannot say what they do',
      why: 'A screen reader announces such a button as just "button", so visitors who rely on one can\'t tell whether it submits, resets or searches. They may give up on the form, and the page fails accessibility guidelines.',
      fix: 'Ask your developer to give each button short text such as "Subscribe" in the theme or form plugin; if the form is built in the CMS, the editor can fill in the button text there.',
    },
    hint: 'Give every form button text that names its action.',
    explanation:
      "Lighthouse checks that input buttons — the submit, reset and plain button inputs used in forms — have discernible text, usually set through their value. Without it a screen reader user cannot tell what the button does. Adding a short label that names the action fixes it, and Deque maps the rule to WCAG 2.2 success criterion 4.1.2 (Name, Role, Value). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.inputButtonName],
  },
  LH_INPUT_IMAGE_ALT: {
    audit: 'input-image-alt',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Image buttons without alt text',
    passLabel: 'Image buttons have alt text',
    plain: {
      what: 'Some buttons are pictures with no text description of what they do',
      why: "Screen reader users can't tell what an image button does, even when the picture shows words, so they may be unable to search, submit or sign up. The page also fails accessibility guidelines.",
      fix: 'Ask your developer to add alt text to each image button in the theme or form plugin that names the action, such as "Search", rather than describing the picture.',
    },
    hint: 'Give image buttons alt text that names the action.',
    explanation:
      'Lighthouse checks that every image used as a form button (an input of type image) has alternative text. A screen reader cannot read words drawn inside an image, so without alt text the button\'s purpose is lost. The alt text should name the action — "Search", "Submit order" — rather than describe the picture. Deque maps the rule to WCAG 2.2 success criteria 1.1.1 (Non-text Content) and 4.1.2 (Name, Role, Value). Google does not use this as a ranking signal; it is separate from the alt text on content images that Google reads for image search. The result comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [LH_SOURCE.inputImageAlt, SOURCE.waiImages],
  },
  LH_LABEL: {
    audit: 'label',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Form fields without labels',
    passLabel: 'Form fields have labels',
    plain: {
      what: 'Some boxes in a form have no label telling screen reader users what to enter',
      why: 'Visitors using screen readers hear only the kind of field, not what it is for, and must guess what to type, so contact and sign-up forms go unfinished. The form also fails accessibility guidelines.',
      fix: 'Ask your developer to link a visible label to each field in the theme or form plugin; wording that merely sits next to the box is not enough for a screen reader.',
    },
    hint: 'Link a visible label to every form field.',
    explanation:
      "Lighthouse checks that every form control — text boxes, checkboxes, radio buttons and the like — has a label tied to it in the code. Sighted visitors often infer a field's purpose from the layout, but a screen reader needs the label linked to the field, and text that merely sits beside it does not count. Linking a visible label to each field fixes it; Deque maps the rule to WCAG 2.2 success criterion 4.1.2 (Name, Role, Value). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.label],
  },
  LH_LINK_IN_TEXT_BLOCK: {
    audit: 'link-in-text-block',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Links that stand out only by colour',
    passLabel: 'Links stand out by more than colour',
    plain: {
      what: 'Links inside paragraphs are told apart from the surrounding text only by their colour',
      why: 'Visitors with low vision or colour blindness, which affects about 8% of men, may not notice the links at all, so they miss the pages you want them to reach.',
      fix: "Ask your developer to underline links in body text through the theme's styles, or mark them some other way that doesn't rely on colour.",
    },
    hint: 'Underline links in running text so colour is not the only cue.',
    explanation:
      "Lighthouse checks links that sit inside a block of text and fails those that differ from the surrounding words only by colour — no underline or other style — where the contrast between the link colour and the text colour is also below 3:1. People with low vision or colour blindness may not notice such links. Underlining links in running text is the simplest fix. Deque maps the rule to WCAG 2.2 success criterion 1.4.1 (Use of Color). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.linkInTextBlock],
  },
  LH_LINK_NAME: {
    audit: 'link-name',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Links without a readable name',
    passLabel: 'Links have readable names',
    plain: {
      what: 'Some links give screen readers nothing to announce about where they lead',
      why: 'Google reads link text to learn what the linked page is about, so a link with none tells it nothing. Screen reader users hear only "link" or a web address and can\'t tell where it goes.',
      fix: 'The editor can add link text, or alt text on a linked image, in the CMS; for icon links in the theme, such as social media icons, ask your developer to add a hidden label.',
    },
    hint: 'Give every link words: visible text, alt text on a linked image, or a hidden label.',
    explanation:
      "Lighthouse checks that every link has a discernible name — its text, the alt text of an image inside it, or a label hidden visually for screen readers. Unlike our own check of the article content, it looks at every link on the rendered page, menus, footers and icons included. Google reads a link's text as a description of the page it points to and, for a linked image, falls back to the image's alt text, so a nameless link passes nothing on; WCAG 2.2 counts it as a failure of link purpose (success criterion 2.4.4). Adding words, or alt text to the linked image, fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [
      LH_SOURCE.linkName,
      SOURCE.crawlableLinks,
      SOURCE.wcagLinkPurpose,
    ],
  },
  LH_LIST: {
    audit: 'list',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Lists with stray content inside',
    passLabel: 'Lists hold only list items',
    plain: {
      what: 'Some bulleted or numbered lists hold content that is not a list item',
      why: 'Screen readers announce a list and how many items it has so visitors know what to expect; stray content breaks that, and people who rely on them lose track of where they are in it.',
      fix: "Ask your developer to fix the list in the theme or plugin that builds it; if the list is in an article, the editor can recreate it with the CMS editor's list button.",
    },
    hint: 'Keep only list items directly inside a bulleted or numbered list.',
    explanation:
      "Lighthouse checks that every bulleted and numbered list directly contains only list items, plus the script and template elements that support them. Headings, paragraphs or other elements placed straight inside a list break the structure screen readers rely on to announce it. Wrapping the stray content in a list item, or moving it out of the list, fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.3.1 (Info and Relationships). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.list],
  },
  LH_LISTITEM: {
    audit: 'listitem',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'List items outside a list',
    passLabel: 'List items sit in a list',
    plain: {
      what: 'Some lines are set up as list items without being inside a list',
      why: "Screen readers can't tell visitors that they are in a list or how many items it has, so people who rely on them get a run of fragments with no context.",
      fix: 'Ask your developer to place these items inside a proper bulleted or numbered list in the theme or plugin that outputs them.',
    },
    hint: 'Put every list item inside a bulleted or numbered list.',
    explanation:
      "Lighthouse checks that every list item sits inside a bulleted list, a numbered list or a menu element. A list item on its own gives screen readers no list to announce, so the listener misses that the lines belong together and how many there are. Wrapping the items in the right parent list fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.3.1 (Info and Relationships). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.listitem],
  },
  LH_META_REFRESH: {
    audit: 'meta-refresh',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Page refreshes or redirects on a timer',
    passLabel: 'No timed refresh or redirect',
    plain: {
      what: 'The page reloads itself or sends visitors elsewhere after a set delay',
      why: "Visitors can't stop or slow it, so people who read slowly or use a screen reader can be moved on before they finish, and a reload throws them back to the top. Google treats a delayed redirect as only a temporary one.",
      fix: 'Ask your developer or hosting provider to replace a timed redirect with a permanent server-side redirect; if the page refreshes itself, the developer can remove that from the theme.',
    },
    hint: 'Replace timed refreshes and redirects with a server-side redirect, or remove them.',
    explanation:
      "Lighthouse fails a page that uses a meta refresh to reload itself or redirect after a delay; Deque's rule flags delays under 20 hours. Visitors have no control over when it happens, and a reload returns the screen reader's focus to the top of the page, which Deque maps to WCAG 2.2 success criterion 2.2.1 (Timing Adjustable). For search, Google follows meta refresh redirects, treating an instant one as permanent and a delayed one as temporary, and suggests them only where server-side redirects aren't possible. Replacing a redirect with a server-side 301, or removing the refresh, fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.metaRefresh, SOURCE.redirects],
  },
  LH_META_VIEWPORT: {
    audit: 'meta-viewport',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Zooming is blocked on phones',
    passLabel: 'Zooming is allowed on phones',
    plain: {
      what: 'The page stops visitors from zooming in, or limits how far they can zoom, on their phones',
      why: 'Visitors with low vision who pinch to zoom cannot enlarge the text enough, so they may not be able to read the page at all. This is an accessibility problem; Google does not document it as a ranking factor.',
      fix: 'Ask your developer to remove the zoom restriction from the viewport setting in the theme template, keeping the rest of that setting as it is.',
    },
    hint: 'Remove user-scalable=no and any maximum-scale below 5 from the viewport tag.',
    explanation:
      "Lighthouse checks the page's viewport meta tag and fails it when it sets user-scalable=no or a maximum-scale below 5, either of which stops or caps pinch-zoom. People with low vision rely on zooming to read; Deque maps the rule to WCAG 2.2 success criterion 1.4.4 (Resize text). This is a different concern from a missing viewport tag: the tag itself, which makes the page fit a phone screen, should stay, and Google does not document blocking zoom as a ranking signal. Removing user-scalable=no and any low maximum-scale fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.metaViewport, SOURCE.mdnViewport],
  },
  LH_OBJECT_ALT: {
    audit: 'object-alt',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Embedded objects without a text alternative',
    passLabel: 'Embedded objects have a text alternative',
    plain: {
      what: 'Some embedded media or documents have no text description for screen readers',
      why: "Screen readers can't describe embedded media, documents or pages on their own, so visitors who rely on them miss whatever that content holds, and the page fails accessibility guidelines.",
      fix: 'Ask your developer to add a short description of each embedded object in the theme or plugin that inserts it, saying what the object contains.',
    },
    hint: 'Give each embedded object a short text alternative.',
    explanation:
      "Lighthouse checks that every object element — used to embed multimedia, documents or another web page — has a text alternative, such as a title or label. Screen readers cannot turn non-text content into speech, so without one the visitor learns nothing about what is embedded. Adding a short description of the object's content fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.1.1 (Non-text Content). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.objectAlt],
  },
  LH_SELECT_NAME: {
    audit: 'select-name',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Drop-down menus without labels',
    passLabel: 'Drop-down menus have labels',
    plain: {
      what: 'Some drop-down menus in forms have no label saying what to choose',
      why: 'Screen reader users hear a list of options with no question attached, so they may pick the wrong one or abandon the form, and the form fails accessibility guidelines.',
      fix: 'Ask your developer to link a visible label to each drop-down in the theme or form plugin, such as "Province" above a list of provinces.',
    },
    hint: 'Link a visible label to every drop-down menu.',
    explanation:
      "Lighthouse checks that every select element — a drop-down list in a form — has a label tied to it in the code, or another accessible name. Sighted visitors read its purpose from nearby text, but a screen reader needs that link to announce it. Linking a visible label to each drop-down fixes it; Deque maps the rule to WCAG 2.2 success criterion 4.1.2 (Name, Role, Value). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.selectName],
  },
  LH_SKIP_LINK: {
    audit: 'skip-link',
    weights: { accessibility: 3 },
    severity: 'notice',
    label: 'Skip link leads nowhere',
    passLabel: 'Skip links lead to their target',
    plain: {
      what: "The page's skip-to-content shortcut points to a spot that keyboard users can't reach",
      why: 'Keyboard and screen reader users use this shortcut to jump past the menu to the article; when it leads nowhere, they have to tab or listen through the whole menu on every page.',
      fix: 'Ask your developer to point the skip link in the theme at the main content area, and to make sure that area exists on every page template.',
    },
    hint: 'Point the skip link at a main content area that exists and can take focus.',
    explanation:
      "Lighthouse checks the skip links the page already has — same-page links, often hidden until a keyboard user reaches them, that let a visitor jump past the navigation — and fails one whose target does not exist or cannot receive focus. Screen readers read a page in order, so without a working skip link keyboard and screen reader users go through the whole menu before reaching the content. Pointing each skip link at an existing, focusable main content area fixes it; Deque lists the rule as a best practice. Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.skipLink],
  },
  LH_TABINDEX: {
    audit: 'tabindex',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Tab order forced out of reading order',
    passLabel: 'Tab order follows reading order',
    plain: {
      what: 'The page forces its own order for moving through it with the Tab key',
      why: 'Keyboard users expect Tab to move down the page in reading order; a forced order jumps around and can seem to skip links and fields entirely, which disorients them and screen reader users.',
      fix: 'Ask your developer to remove the forced Tab order from the theme or plugin that sets it, and to fix the order of the content itself if it needs changing.',
    },
    hint: 'Remove tabindex values above 0 and let the content order set the Tab order.',
    explanation:
      "Lighthouse fails a page where any element has a tabindex value greater than 0. Such values pull those elements to the front of the Tab sequence, so keyboard and screen reader users jump around the page and may seem to skip items entirely. Removing the positive values — using 0 or -1 where needed — and arranging the content in a logical order fixes it; Deque lists the rule as a best practice. Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.tabindex],
  },
  LH_TARGET_SIZE: {
    audit: 'target-size',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Tap targets too small or crowded',
    passLabel: 'Tap targets are large enough',
    plain: {
      what: 'Some buttons and links are too small or too close together to tap reliably',
      why: 'Phone users, and people with hand tremors or limited dexterity, tap the wrong thing or miss altogether, which costs clicks on menus, buttons and calls to action.',
      fix: 'Ask your developer to enlarge small buttons, links and icons in the theme, or add space around them, so each one is easy to tap on its own.',
    },
    hint: 'Make tap targets at least 24 by 24 pixels, or space them apart.',
    explanation:
      "Lighthouse checks that every touch target — link, button or form control — is at least 24 by 24 CSS pixels, or, if smaller, has enough room that a 24-pixel circle centred on it doesn't overlap another target or its circle. Small or crowded targets are hard to hit on a phone and for anyone with limited dexterity. Enlarging the targets or spacing them out fixes it; Deque maps the rule to WCAG 2.2 success criterion 2.5.8 (Target Size (Minimum)). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.targetSize],
  },
  LH_TD_HEADERS_ATTR: {
    audit: 'td-headers-attr',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Table cells point to the wrong headers',
    passLabel: 'Table cells point to the right headers',
    plain: {
      what: "Some table cells are linked to headers that aren't in the same table",
      why: "Screen reader users move through a table cell by cell, hearing each cell's headers as they go; broken links between cells and headers give them wrong or missing context for the figures.",
      fix: "Ask your developer to correct the header references in the table's code; if the table is in an article, the editor can rebuild it with the CMS's table tool.",
    },
    hint: 'Make table cells refer only to header cells in the same table.',
    explanation:
      "Lighthouse checks that table cells using the headers attribute refer only to other cells in the same table. Screen readers read out the relevant headers as a user moves from cell to cell, and a reference to a cell outside the table breaks that. Correcting the references — or, for a simple table, dropping them and marking the header row and column properly — fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.3.1 (Info and Relationships). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.tdHeadersAttr],
  },
  LH_TH_HAS_DATA_CELLS: {
    audit: 'th-has-data-cells',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Table headers with no data under them',
    passLabel: 'Table headers have data under them',
    plain: {
      what: 'Some table headers label nothing, so the table reads confusingly aloud',
      why: "Screen reader users rely on headers to know what each figure means; headers with no cells beneath them suggest columns that aren't there and muddle the whole table.",
      fix: 'Ask your developer to remove empty header cells or fix the table structure in the template; for a table in an article, the editor can rebuild it in the CMS so every header has data.',
    },
    hint: 'Use a table header only where there are data cells for it.',
    explanation:
      "Lighthouse checks that every table header cell — and every element marked as a column or row header — has data cells it describes. A header with nothing beneath or beside it leaves screen reader users unable to work out how headers and data relate. Removing orphaned headers, or using a header only where there is data for it, fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.3.1 (Info and Relationships). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.thHasDataCells],
  },
  LH_VALID_LANG: {
    audit: 'valid-lang',
    weights: { accessibility: 7 },
    severity: 'notice',
    label: 'Passages with an invalid language code',
    passLabel: 'Passage language codes are valid',
    plain: {
      what: "Passages marked as being in another language use a code screen readers can't recognise",
      why: "This does not affect Google rankings, as Google reads the language from the text. Screen readers can't switch voice for an unknown code, so quotes or phrases in another language may be mispronounced to visitors who use them.",
      fix: 'Ask your developer to correct the language codes in the theme, or the editor to fix them where they were added in the CMS, using standard codes such as fr or es.',
    },
    hint: 'Use standard language codes such as fr or es on passages in another language.',
    explanation:
      "Lighthouse checks every lang attribute inside the page — on quotes, phrases or sections marked as another language — and fails any value that is not a valid BCP 47 language tag. Screen readers switch pronunciation libraries by these codes, so an invalid one leaves the passage read in the wrong voice; Deque maps the rule to WCAG 2.2 success criterion 3.1.2 (Language of Parts). Google uses the visible text to determine language and does not use lang attributes, so this does not affect Google rankings. Replacing each invalid value with a standard tag fixes it. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.validLang, SOURCE.multiRegional],
  },
  LH_VIDEO_CAPTION: {
    audit: 'video-caption',
    weights: { accessibility: 10 },
    severity: 'notice',
    label: 'Videos without captions',
    passLabel: 'Videos have captions',
    plain: {
      what: 'Videos on this page come without captions for viewers who cannot hear them',
      why: 'Deaf and hard-of-hearing visitors miss everything said in the video, and so does anyone watching with the sound off. Uncaptioned video is a plain accessibility gap that guidelines require closing.',
      fix: 'Ask your developer to add a captions file to each video in the theme or video plugin; the writer or editor can supply the transcript it is built from.',
    },
    hint: 'Add a captions track to every video.',
    explanation:
      "Lighthouse checks that every video element includes a captions track. Without captions, deaf and hard-of-hearing visitors have no access to the dialogue, narration or meaningful sounds; good captions cover all of these and say who is speaking, not only the words. Adding a captions file to each video fixes it, and Deque maps the rule to WCAG 2.2 success criterion 1.2.2 (Captions (Prerecorded)). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.videoCaption],
  },
  LH_LANDMARK_ONE_MAIN: {
    audit: 'landmark-one-main',
    weights: { accessibility: 3 },
    severity: 'notice',
    label: 'No main content area marked',
    passLabel: 'Main content area is marked',
    plain: {
      what: 'Screen reader users have no marked main section of the page to jump straight to',
      why: 'People using screen readers jump between labelled regions of a page; with no main region marked, they must listen through the header and menus to find the article.',
      fix: "Ask your developer to mark the article area as the page's main region in the theme template, once on every page.",
    },
    hint: 'Wrap the main content in a single main element in the template.',
    explanation:
      "Lighthouse checks that the page has a main landmark — a main element, or an element given the main role — marking its primary content. Screen reader users navigate by landmarks such as header, navigation, main and footer, so without a main region the content is hard to find. Wrapping the content area of the template in a single main element fixes it; Deque lists the rule as a best practice. Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.landmarkOneMain],
  },
  LH_AUTOCOMPLETE_VALID: {
    audit: 'autocomplete-valid',
    weights: { accessibility: 1 },
    severity: 'notice',
    label: 'Form autofill hints are wrong',
    passLabel: 'Form autofill hints are valid',
    plain: {
      what: 'Some form fields carry autofill hints that browsers and screen readers cannot use',
      why: 'Visitors with motor, vision or cognitive difficulties lean on autofill to complete forms; broken hints stop details such as name and email filling in, so sign-ups and enquiries take more effort.',
      fix: "Ask your developer to correct the fields' autofill settings in the theme or form plugin to standard ones, such as email or tel.",
    },
    hint: 'Use standard autocomplete values such as name, email or tel.',
    explanation:
      "Lighthouse checks that every autocomplete attribute on a form field uses a valid value, such as name, email or postal-code, and is applied correctly to that field. Correct values let browsers fill in a visitor's details and let assistive technology identify each field's purpose; an invalid one does neither. Replacing invalid values with the standard ones fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.3.5 (Identify Input Purpose). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.autocompleteValid],
  },
  LH_PRESENTATION_ROLE_CONFLICT: {
    audit: 'presentation-role-conflict',
    weights: { accessibility: 1 },
    severity: 'notice',
    label: 'Decorative parts screen readers still reach',
    passLabel: 'Decorative parts are hidden from screen readers',
    plain: {
      what: 'Parts of the page marked as decorative are still picked up by screen readers',
      why: 'Screen reader users land on items that were meant to be skipped and hear them announced without a useful name, which clutters and confuses the page for them.',
      fix: 'Ask your developer to either stop marking these parts as decorative or remove what makes them focusable or labelled, in the theme or plugin that outputs them.',
    },
    hint: 'Keep decorative elements unfocusable and free of extra ARIA attributes.',
    explanation:
      'Lighthouse checks elements given role="none" or role="presentation", which tell assistive technology to ignore them. If such an element can take keyboard focus or carries a global ARIA attribute, its decorative role does not take effect, and screen readers can reach it after all. Removing the focusability and the extra attributes, or dropping the decorative role if the element matters, fixes it; Deque lists the rule as a best practice. Google does not use this as a ranking signal. The result comes from Lighthouse\'s lab run of the page as Google\'s PageSpeed Insights renders it on a phone.',
    sources: [LH_SOURCE.presentationRoleConflict],
  },
  LH_SVG_IMG_ALT: {
    audit: 'svg-img-alt',
    weights: { accessibility: 1 },
    severity: 'notice',
    label: 'Icons and graphics without a description',
    passLabel: 'Icons and graphics have descriptions',
    plain: {
      what: 'Some icons, charts and other drawn graphics have no text description',
      why: "Screen reader users get nothing for these graphics, so the information they carry, such as a chart's figures or an icon's meaning, is lost to them, and the page fails accessibility guidelines.",
      fix: 'Ask your developer to give each meaningful graphic in the theme or plugin a short text description, and to mark purely decorative ones so screen readers skip them.',
    },
    hint: 'Give meaningful SVG graphics a short text alternative.',
    explanation:
      "Lighthouse checks SVG graphics marked as images (with the img, graphics-document or graphics-symbol role) and fails any without a text alternative, such as a title element or a label. Screen readers cannot describe vector drawings on their own. Adding a short description to each such graphic, or removing the image role from purely decorative ones, fixes it; Deque maps the rule to WCAG 2.2 success criterion 1.1.1 (Non-text Content). Google does not use this as a ranking signal. The result comes from Lighthouse's lab run of the page as Google's PageSpeed Insights renders it on a phone.",
    sources: [LH_SOURCE.svgImgAlt, SOURCE.waiImages],
  },
} as const satisfies Record<string, ILighthouseIssueDefinition>;
