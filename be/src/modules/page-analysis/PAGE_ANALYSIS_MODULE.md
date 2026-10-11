# Page analysis module

Pure business opinions about a run's pages — no I/O, no clock — behind `PageAnalysisService`.

**Only crawl-owned codes are this module's checks.** The catalogue is a registry of owners
(`ISSUE_CATALOGUES` in `@app/contracts`: crawl, pageSpeed, lighthouse), and an entry's owner is
the key its catalogue sits under; the check registry is typed over `TCrawlIssueCode`, so a
check for another owner's code — or a crawl code without one — does not compile. The six
`CWV_*` codes are written by the PageSpeed worker from Google's measurement and are never in
`checks_judged`, the score or the checks list. The 66 `LH_*` codes are Lighthouse's SEO and
accessibility audits, written by the same worker from the same answer: they ARE checks and
count in the score, but they are recorded on `page_speed`, never here (lighthouse-checks). Each
entry also carries `plain` — what / why / fix for a marketer — beside the technical label, hint
and explanation; `issue-plain-copy.test.ts` holds all 154 entries (page, speed, Lighthouse and
site) to it.
The speed codes therefore have no `<code>.check.spec.ts`: they are pinned where they are written,
by `be/src/modules/page-speed/services/cwv-issues/cwv-issues-of.spec.ts`. The five HTML Core Web
Vitals risk checks below stay crawl checks at notice — measured speed did not replace them — and
their plain copy says each is a risk read from the code, not a measurement; the issue report
files them under SEO, not Speed (`issueTypeOf.test.ts` pins that on purpose).

- **Keywords (D15).** Candidates are 1–4-grams that never start or end with a stop word (the
  page's declared language; no language → 2-grams, no filtering), with the site's own word, or
  with a token that cannot bound a phrase — one character, or digits. Those sit INSIDE a
  candidate instead: a run of text ends only at a sentence or a heading, because ending it at
  every `в` and `с` left Slavic pages scoring the fragments of phrases that were never
  candidates. A word the page truncated for display ("Presiden…") is dropped, not tokenized.
  Score = presence in title 5, H1 4, URL slug 3, description 2, H2/H3 2, first paragraph 1.5,
  plus 2.5 × ln(1 + body frequency); × 1.25 per extra deliberate field; × 1.15 if the page
  declares it (JSON-LD `keywords`, `article:tag`); × 0.6 for a single word and ≈ 1.15 for a
  phrase; × an IDF factor over the run's pages, so a term on every page (the brand) fades.
  Zero — not a keyword at all — when no title, heading or slug names it and the body says it
  once. A word gives way to a phrase containing it that scores ≥ 0.5 of it. Then at most 8 are
  kept above 0.15 of the top score, no two covering half the same words and at most two out of
  any one sentence; **1–8 keywords, and a page about one thing says one**. Relevance = score /
  top.
  Rejected: TF-IDF alone (ignores where a phrase sits), YAKE/RAKE (no field weights), an LLM or a
  SERP API (cost, non-determinism, keys). Also rejected: topping a short list up to a minimum,
  which is what produced five keywords for a page with one, four of them below the floor the
  scoring had just applied.
- **What the run knows, the page cannot.** Before scoring, two things are read across the run's
  pages and passed into every page: title tail segments that most pages repeat (a CMS section,
  "… - National | Globalnews.ca", stripped like the brand) and declared keywords that most
  pages repeat (a rubric, not a subject, so no declared bonus). Same evidence as the IDF step,
  read early enough to keep chrome out of the candidates instead of damping it afterwards.
- **Title brand suffix** ("… • Yoast", "… | Semrush Blog") is cut when its last segment names the
  site (first label of the site key, or `og:site_name`) — repeatedly, because a CMS appends its
  section after the brand and cutting once left the section as the page's top keyword.
- **The content boundary decides more than the scoring does.** The `article` holding the `h1`
  beats the `main` around it, and landmark roles and the class fragments themes use for
  furniture (`related`, `infobox`, `sidebar`, `widget`, `newsletter`, `share`, `comments`…) go
  with `nav` and `aside`. A theme that closes `</article>` and opens its related posts next to
  it made other pages' subjects into this page's keywords, and because the widget column
  differed between crawls the same article returned two disjoint keyword sets on two runs —
  positions recorded against terms the next crawl would not produce. An `article` without the
  `h1` is not trusted: in a listing every card is one.
- **Checks:** one unit per code of `SEO_ISSUE_CATALOGUE` (contracts), each its own file under
  `services/checks/`, collected in `CHECKS` typed `{ [K in TSeoIssueCode]: TCheck<K> }` — a code
  without a check does not compile. The unit carries its own `code`, so registering it under
  another code does not compile either; without that, two unmeasured checks are structurally
  identical and the swap would be silent. The mapped type also decides what a check may RETURN: a
  code whose catalogue entry declares a bound returns a measurement `{ value, min?, max? }`, every
  other code returns details. Thresholds live in the catalogue, so the check and the screen quote
  one number, and the bounds are copied INTO the stored finding at crawl time — an old verdict
  explains itself against the bounds it was judged by, not against today's. Severity comes from the
  catalogue, never the check.
- **What a check READS follows from its code, not from the check.** `scope: 'run'` in the
  catalogue makes `TCheck<K>` resolve to a unit that takes the whole crawl and answers once per
  page; everything else takes one page and answers once. So a run-shaped check under a page code is
  a compile error rather than a check that runs and never fires — which is what it would be, since
  "is another page using this title" is not a property of a page.
- **One pass, one loop, in catalogue order.** `evaluateChecks` answers the run-scoped checks first
  (they can only be answered for the whole crawl at once), then walks `ACTIVE_ISSUE_CODES` once per
  page and takes each verdict from where it already is. Order is therefore a property of the loop.
  Built as two passes it was not: the run pass appended its findings and sorted `issues`,
  `checksJudged` and `checksNotApplicable` back into catalogue order on every page, and a later
  step that forgot to sort would not have failed — it would have quietly reordered the screen. The
  registry is a parameter, as the pipeline's steps are, so a check can be trialled beside the
  default instead of replacing it.
- **A retired check keeps its catalogue entry.** `enabled: false` drops a code out of
  `ACTIVE_ISSUE_CODES`, which is what the pass iterates and what `composePageChecks` lists; the
  entry stays so a finding already stored under that code still has a label, a hint and a severity
  to be read back with, and so the gateway's `z.enum` still accepts data this system stored itself.
  A page crawled before the retirement keeps the check in its denominator, which is why the score
  is explained as what applied when the page was crawled.
- **Three outcomes, and the denominator (D3).** A rule answers `pass`, `notApplicable` or `fails`.
  The first two produce no issue and differ only in the score's denominator, which is the whole
  reason the third outcome exists: one `null` return meant either "the title is 45 characters" or
  "there is no title", and a page with no title was rewarded for passing a check that never ran.
  Twenty-eight of the seventy checks always apply; forty-two are conditional. Thirty-eight
  of those are page-scoped — TITLE_LENGTH and META_DESCRIPTION_LENGTH on the field existing,
  CANONICAL_MISMATCH, CANONICAL_CONFLICT and CANONICAL_RELATIVE on there being a canonical,
  STRUCTURED_DATA_INVALID on there being any JSON-LD, DATES_INCONSISTENT on a publication
  date,
  IMAGES_MISSING_ALT on there being an image, HEADING_SKIP on there being two or more headings,
  HREFLANG_INVALID on the page declaring an alternate, MIXED_CONTENT on the page being served over
  HTTPS at all, STRUCTURED_DATA_INCOMPLETE on there being an article node to inspect,
  INTERNAL_LINKS_NOFOLLOW and INTERNAL_LINK_VARIANTS on there being a link to another page of the
  site, ROBOTS_BLOCKS_GOOGLEBOT and ROBOTS_BLOCKS_AI_SEARCH on the robots.txt governing the
  page's host, ROBOTS_BLOCKS_RESOURCES on the page loading a script or stylesheet from such a
  host, DATE_BUMPED_WITHOUT_CHANGES on an earlier crawl having recorded the page,
  LCP_IMAGE_LAZY_LOADED on the page showing a featured image, TITLE_SCRIPT_MISMATCH on a title
  over enough text in one script, IMAGES_NOT_INDEXABLE and IMAGE_FILENAMES_GENERIC on there
  being an image (with a file name), VIDEO_WITHOUT_METADATA on an embedded video,
  PREVIEW_IMAGE_TOO_SMALL on the page's own image having been measured, PREVIEW_IMAGE_IS_LOGO on
  the page naming an image for itself, AUTHOR_MARKUP_INCOMPLETE, ARTICLE_DATE_FORMAT_INVALID and
  ARTICLE_HEADLINE_MISMATCH on the article markup giving an author, a date or a headline,
  BREADCRUMB_INVALID on a BreadcrumbList, the Ahrefs-gap checks on what each reads (below),
  NO_SUBHEADINGS, NO_IMAGES and NO_EXTERNAL_SOURCES on
  the text running to THIN_CONTENT's 300 words — and four are run-scoped, skipped when the run
  holds one page or the page has no value to compare. So `28 <= checks_applicable <= 70`, which
  `checks.registry.spec.ts` asserts over every recorded fixture post, and which is why a page's
  score can never rest on a denominator too small to mean anything. Applicability is counted HERE, at crawl time, because the stored
  `pages` row holds no canonical, no Open Graph and no JSON-LD and cannot answer it later.
- **The pass records WHICH checks ran, not only how many.** `evaluateChecks` returns two
  disjoint lists in catalogue order — `checksJudged` and `checksNotApplicable` — and their union
  is THE CATALOGUE THAT CRAWL RAN. That union is the only record of it there will ever be:
  read back against a catalogue that has since grown, a code in neither list is one that did not
  exist — or did not run — when the page was seen, and a count alone cannot say which. No
  constraint can state the union property, because any spelling of it names the catalogue's size
  and would break every older row the day a check is added; `checks.registry.spec.ts` asserts it
  over the recorded corpus instead. What the database CAN state, and does, is
  `checks_applicable = cardinality(checks_judged)`.

<!-- invariant: ANALYSIS-011 -->

**One pass records which checks it judged and which it could not.** The two lists are disjoint,
in catalogue order, and their union is the catalogue that crawl ran. Pinned by
`be/src/modules/page-analysis/services/checks/checks.registry.spec.ts` ->
"drops every conditional check together on a bare page in a run of one" and "emits only catalogued
codes over every recorded page", which assert disjointness and the union over the recorded
corpus. The counter
half is pinned by the database instead: CHECK `pages_checks_judged_matches_applicable`.
Specified in `openspec/specs/be/src/modules/page-analysis/spec.md`.

- **A skippable check declares why, in the catalogue.** The reason is a property of the check and
  not of a page — `IMAGES_MISSING_ALT` is skipped for one reason every time — so it is
  `skipReason` beside `label` and `hint`, and `CONDITIONAL_ISSUE_CODES` is derived from its
  presence rather than repeated as a second list. The registry spec asserts the skipped set over
  the corpus is exactly those codes, which is what fails when a check learns to skip and the
  catalogue is not told why.
- **Six checks added from what Lighthouse, Google and the audit vendors document (2026-10-04).**
  `VIEWPORT_MISSING`, `HREFLANG_INVALID` and `NO_INTERNAL_LINKS` close the three gaps against
  Lighthouse's SEO category; `MIXED_CONTENT` and `META_REFRESH` are errors Semrush and Ahrefs both
  raise and HTML answers for free; `STRUCTURED_DATA_INCOMPLETE` reads the article node the
  extractor was already parsing and never consulting. Each is severity-ranked by the line
  `ranking-signals.md` draws: an error is for what keeps a page OUT OF THE RUNNING, so none of the
  six is one. Measured on the 43 recorded posts before being believed: they fire 1, 0, 0, 0, 0 and
  0 times, and `HREFLANG_INVALID` is skipped on 39 of 43 — which is the shape wanted, since the
  corpus is two competent publishers and a check that fired across it would be reporting a house
  style. The one firing is a page with no server-rendered content at all.
- **Every finding shows its proof, and every check says why at length (2026-10-09).** A finding
  carries `evidence` — the markup, header or robots.txt rule it is about, as found on the page,
  at most five quotes of at most 320 characters — because a claim the reader cannot check against
  the page source is one they have to take on trust. The catalogue gives every code an
  `explanation` (what the check reads, why it matters and to whom, and — where it is true — that
  Google does NOT use the signal: heading order, `lang`, word count) and `sources`, first-party
  documentation each opened and read against its claim on the day it was cited. The registry spec
  builds a run in which every check fails and asserts each finding quotes something, so a check
  that cannot fail, or fails without proof, does not get past CI. Findings stored before this
  carry no evidence and render without it.
- **Seven checks added from Google's crawling and indexing documentation (2026-10-09).**
  `ROBOTS_BLOCKS_GOOGLEBOT` (error — a page Google may not fetch is out of the running) asks the
  run's robots.txt about Googlebot, which the crawl never did: it obeyed the file under its own
  name, so a group closing the site to Google alone was invisible. `ROBOTS_BLOCKS_RESOURCES` asks
  the same of the page's scripts and stylesheets on that host — Google will not render with what
  it may not fetch. `CANONICAL_CONFLICT` reports a page declaring two canonicals, in tags or in a
  `Link` header. `UNCRAWLABLE_LINKS`, `INTERNAL_LINKS_NOFOLLOW` and `INTERNAL_LINK_VARIANTS` read
  the content's links for what Google's link guidance names: no href or a `javascript:` one;
  nofollow on the site's own pages; HTTP, the other www-variant or a tracking parameter where the
  served URL belongs. `HTML_NOT_COMPRESSED` reads the `Content-Encoding` of an answer the crawl
  requested with `gzip, deflate, br`. On the 43 recorded posts they fire 0, 0, 0, 0, 1, 3 and 0
  times: yoast's `nofollow` on an add-to-cart link, and semrush linking to its bare host and with
  `utm_` parameters from three posts — real, and not a house style.
- **Four existing checks read more than they did (2026-10-09).** `NOINDEX` reads
  `<meta name="googlebot">`, and an X-Robots-Tag scoped to another crawler (`bingbot: noindex`)
  no longer counts as one for Google. `CANONICAL_MISSING` accepts a canonical in a `Link` header
  and quotes one written in `<body>`, which Google ignores; the extractor reads canonicals from
  `<head>` only, as Google does. `NO_INTERNAL_LINKS` no longer counts a table of contents —
  links back into the page lead nowhere new. `REDIRECTED` quotes every hop with its status, since
  a 302 tells Google to keep the URL the sitemap lists. And the extractor resolves every URL
  against `<base href>`, as a browser and Googlebot do.
- **Five checks from Google's ranking guidance (2026-10-09).** `SNIPPET_RESTRICTED` reads the
  same robots declarations as NOINDEX for `nosnippet` and `max-snippet:0`, which Google applies
  to its AI features as well as to the snippet. `ROBOTS_BLOCKS_AI_SEARCH` asks robots.txt about
  the SEARCH crawlers of AI assistants (OAI-SearchBot, PerplexityBot, bingbot; Claude-SearchBot
  since 2026-10-11, which Anthropic says governs visibility in Claude's search) and never the
  training ones, whose closing costs no visibility. `AUTHOR_MISSING` is the "who" of Google's
  helpful-content questions, counted only where the markup identifies an author.
  `DATE_BUMPED_WITHOUT_CHANGES` compares the page with the client's previous crawl — the main
  text's SHA-256 and the declared modification date are stored on the page row — and fires on
  a date that moved over identical words, which Google names as a sign of content written for
  search engines. `NEAR_DUPLICATE_CONTENT` compares the crawl's pages by five-word shingles; a
  page with its city swapped ten times in 300 words shares 0.73, and on the recorded corpus the
  closest pair shares 0.19 (semrush) and 0.08 (yoast), against a line of 0.6. Measured on the
  43 posts before being believed: AUTHOR_MISSING fires twice, on the two recorded pages that are
  not posts (a listing and a JavaScript shell); SNIPPET_RESTRICTED, ROBOTS_BLOCKS_AI_SEARCH and
  NEAR_DUPLICATE_CONTENT never fire. DATE_BUMPED_WITHOUT_CHANGES needs two crawls of a page, which
  a recording does not hold, and is pinned by its own spec instead.
- **Two severities moved to the line ranking-signals.md draws (2026-10-09).** H1_MISSING is a
  warning, not an error: Google states heading structure does not matter to Search, so a page
  without an h1 is not out of the running. THIN_CONTENT is a notice: Google has no preferred
  word count. A finding stored before keeps the severity it was judged with until the next crawl.
- **Keyword stuffing was built, measured and removed (2026-10-09).** Google's spam policies name
  it and publish no density, so the check was comparative: a page whose top keyword is three
  times denser than the site's median. On the recorded posts it fired on four ordinary articles —
  "google analytics" at 3.5% in a post about Google Analytics, "http 2" at 2.9% in a post about
  HTTP/2 — because a post about a thing names the thing, and a site's median is pulled down by
  posts whose top keyword is rare. Per paragraph it is no better: a yoast paragraph names its
  product five times in 131 words, denser than Google's own example of stuffing. No line
  separates the two without inventing one, which is the mistake the catalogue refuses.
- **Five checks from the on-page guidance, and one that was broken (2026-10-09).**
  `STRUCTURED_DATA_INVALID` reports a JSON-LD block that is not JSON — read the way Google reads
  it, so a raw line break inside a string is forgiven (`parse-json-ld.ts`, merged from
  `fix/json-ld-control-characters`; without it the one semrush post carrying such a break was
  reported as unreadable). `CANONICAL_RELATIVE` is Google's own advice to use absolute URLs.
  `LINKS_WITHOUT_TEXT` reports links to this site with no accessible name — read before hidden
  text is removed, so a visually-hidden label counts — and leaves other sites' links out: on the
  recorded corpus every nameless link was an icon-only share button to LinkedIn, X or Facebook,
  sixty of them, one set per semrush post. `DATES_INCONSISTENT` is Google's "consistent, accurate
  and not in the future": modified before published, published after the fetch, a URL year the
  date does not share. `CHARSET_MISSING_OR_LATE` is the HTML standard's first 1024 bytes,
  passed by a charset in the Content-Type header. NOINDEX also fails an `unavailable_after` date
  that had passed when the page was fetched — judged against the fetch time the crawl now hands
  in, so the analysis still reads no clock. All five fire 0 times on the 43 recorded posts.
  HREFLANG_INVALID checked grammar, not existence, and passed `ua`, `kz`, `jp` and `en-UK`; it
  now asks `Intl.DisplayNames` whether the language and region exist, rejects the reserved `UK`,
  names the code that was meant, and fails a page whose canonical names another URL, which
  takes it out of its own set. H1_MULTIPLE is a notice: Google has said several h1 elements
  are no problem for Search.
- **Staging leaks, client-side routes, and the site as a whole (2026-10-09).**
  `DEVELOPMENT_HOST_REFERENCES` (warning) reports a canonical, og:url, hreflang, content link or
  loaded resource naming localhost, an IP, a `staging.`/`dev.`/`preview.` host of three labels
  or more (so `dev.to` is a site, not an environment) or a platform preview domain such as
  `*.vercel.app` — unless the page itself is served from it. `UNCRAWLABLE_LINKS` now also
  reports this site's own client-side routes in the fragment (`#/pricing`, `#!about`), the
  example Google's JavaScript guide gives of links it cannot resolve; another site's hashbang
  URL is its own routing and stays an ordinary link — the one recorded case, semrush linking to
  the old Google product forums. Both fire 0 times on the recorded posts.
  The SITE is judged too, by `services/site-checks/`: nine pure checks (twelve since 2026-10-11,
  below) over what discovery read,
  what selection fetched and four extra requests (`SiteProbeService`: the home page at the other
  scheme and www-variants, and an address that cannot exist). Robots.txt past 500 KiB, rules
  Google never supported (`noindex:`, `nofollow:`, `host:`), a Googlebot group that leaves the
  general rules open; sitemap entries that redirect, error, are noindex, name another canonical
  or are disallowed; sitemap URLs on another scheme or host variant; lastmod dates that are all
  alike, stamped at build time, or older than the pages' own; a host variant that serves the
  page itself or redirects in more than one permanent hop; a made-up address answered with 200.
  Every verdict — passed and skipped included — is stored per run in `site_checks` and shown in
  the run log; none counts in a page's score, which stays a page's. On the recorded yoast and
  semrush crawls all nine pass or are not applicable. Not built, for want of a source that says
  so: nested sitemap indexes, and Crawl-delay as a defect (Bing reads it).
- **Core Web Vitals risks the HTML shows (2026-10-09).** Not Core Web Vitals themselves —
  those are field data, which only the Chrome UX Report holds — but five causes the guides name
  that are visible without a browser, each a notice, because Google calls page experience a
  small signal and the larger cost is to readers. `LCP_IMAGE_LAZY_LOADED`: the featured image
  (the <img> showing what og:image names, matched by file stem across a CMS's resized copies)
  marked loading="lazy" — featured, not "first content image", because on the recorded semrush
  posts the first content image is lazy on 18 of 21 and thousands of words down, while the
  featured image is eager on all. `RENDER_BLOCKING_SCRIPTS`: classic external scripts in <head>
  with neither async nor defer (1 of 43). `FONT_PRELOAD_WITHOUT_CROSSORIGIN` (0 of 43).
  `BFCACHE_BLOCKED_BY_NO_STORE` (live: semrush sends no-cache, yoast public). `DOM_SIZE_LARGE`,
  measured against Lighthouse's 1,400 elements (2 of 43, both yoast).
  Rejected after measuring: images without width and height. Semrush's one unsized image per
  post is a template badge sized, if at all, by a stylesheet the HTML does not carry — and a
  check that cannot see the CSS that may size an image would be guessing on twenty pages of
  twenty-one.
- **Field audit on 60 live sites (2026-10-09).** Every check was run through the product on
  60 sites (WordPress, Ghost, Next.js, Substack, Blogger, news and recipe sites, Russian and
  Uzbek ones among them; 635 posts) and each firing read against the live page — the LCP
  verdicts against Lighthouse run locally. What it found wrong, each now pinned by a test built
  from the site's markup: `DEVELOPMENT_HOST_REFERENCES` read other people's live hosts as
  leaks (habr linking `dev.vk.ru`, overreacted linking a `*.vercel.app` tool) — a link or a
  resource now leaks only THIS site's environment, while what names the page itself keeps the
  strict reading. `AUTHOR_MISSING` missed blog.cloudflare.com's byline, which is only links to
  `/author/<slug>/`; such a link is now an author. `DATES_INCONSISTENT` called ghost.org's
  one-second gap between two stamps of one save a contradiction; a minute is now allowed.
  `INTERNAL_LINKS_NOFOLLOW` reported wpbeginner's `/refer/` affiliate redirects and a recipe's
  print copy, both nofollow on purpose. `KEYWORD_CANNIBALISATION` (and the two other duplicate
  checks) set cloudflare's zh-cn and zh-tw versions of one post against each other; language
  versions are now no rivals. kottke.org has neither `<main>` nor `<article>`, its footer was
  read as every post's text and made one-sentence posts 70% alike; the one container a theme
  names (`.post`, `.entry-content`, `itemprop="articleBody"`) is now read first — on the saved
  corpus that changed only kottke, gazeta.uz, neilpatel and seths.blog, removing their menus,
  footers and author boxes and nothing else. `LCP_IMAGE_LAZY_LOADED` took og:image for the hero
  wherever it sat (github.blog's DGit diagram, 2,000 words down) and took a 175-pixel thumbnail
  of it for the hero (neilpatel); the image must now be the first non-thumbnail copy within 60
  words of the headline, and Lighthouse agreed on all twelve posts it was run on. A "first wide
  image" fallback was tried and dropped: Lighthouse found it right on two posts and wrong on four.
  `UNCRAWLABLE_LINKS` reported Ghost's `#/portal/signup` and a `role="button"` menu toggle;
  `ROBOTS_BLOCKS_RESOURCES` reported Cloudflare's `/cdn-cgi/` e-mail decoder. On the site side,
  `HOST_REDIRECT_CHAIN` fired on 31 of 46 sites: it counted stripe's and habr's redirect of the
  home page to a language version as hops, probed `www.blog.cloudflare.com`, and called the
  common two permanent hops (http → https → canonical host, blog.google included) a chain. Only
  host hops count now, from three, and a subdomain gets no www-variant. Words of Chinese and
  Japanese are now split by `Intl.Segmenter`: cloudflare's Japanese post counted 176 words, one
  per sentence, and was reported as thin (2,508 now, against 1,909 for the English original).
  A recrawl on the fixed code found three more. cossa.ru writes articles as bare text in a
  `<div>`, and only `<p>`s were blocks — so its posts' text was the footer, and every post
  "matched" every other; loose text of eight words or more is a block now, and an inline
  wrapper of blocks (hubspot's `<span>`) is read block by block. `UNCRAWLABLE_LINKS` reported
  `javascript:void(0)` buttons and an `onclick` chat toggle; only a script that names an
  address counts now — which leaves the check without a live positive among the 74 sites.
  On the site side, a rate-limited (429) or refused (401/402/403, bot challenge) answer
  is no longer read as a broken sitemap entry or as the end of a redirect chain:
  allrecipes, netflixtechblog and css-tricks turned this crawler away, not Googlebot.
  Live positives the audit read and agreed with, among others: backlinko's Googlebot group
  holding one Allow and so opening `/wp-admin/` to Googlebot, gazeta.uz keeping its own CSS
  from Googlebot with `Disallow: *?*`, cossa.ru's JSON-LD broken by a stray `;`, scripting.com
  served over HTTP only and uncompressed, vercel.com answering a made-up address with its
  login page. Found nowhere among the 74 sites and 150 more scanned, so proven by the specs
  alone: `CANONICAL_CONFLICT`, `CANONICAL_RELATIVE`, `CHARSET_MISSING_OR_LATE`,
  `DATE_BUMPED_WITHOUT_CHANGES` (581 comparisons over three crawls; 89 dates re-read by hand,
  none had moved), `DEVELOPMENT_HOST_REFERENCES`, `FONT_PRELOAD_WITHOUT_CROSSORIGIN`,
  `HREFLANG_INVALID`, `META_REFRESH` (lefigaro's and indianexpress's refreshes reload the
  page and rightly pass), `NOINDEX`, `ROBOTS_BLOCKS_GOOGLEBOT`, `SNIPPET_RESTRICTED`,
  `TITLE_MISSING`, `UNCRAWLABLE_LINKS`, `ROBOTS_TXT_TRUNCATED`, `SITEMAP_LISTS_OTHER_HOST_VARIANTS`.
- **Checks from Google's Search Appearance guides (2026-10-11).** Every guide under
  developers.google.com/search/docs/appearance was read against the catalogue, and what HTML
  answers and Google states was added; each was measured on the 45 recorded pages and on 58
  live posts from 30 sites (habr, vc.ru, cossa, gazeta.uz, lifehacker.ru, tproger among them) and
  every firing read against the page. Page checks, all notices unless named:
  `TITLE_SCRIPT_MISMATCH` (a title with no letter of the main text's script; a Latin brand
  beside Cyrillic passes — fired on none of the Russian and Uzbek pages);
  `IMAGE_PREVIEW_NOT_LARGE` (no robots rule allows `max-image-preview:large`, which Discover
  needs for a large card — 24 of 58: semrush, moz, ahrefs, ghost, cloudflare, habr, vc.ru);
  `IMAGES_NOT_INDEXABLE` (warning: srcset with no src — 0 live. The format is NOT judged by
  the extension: it was, and the one live finding was wrong — shopify.com's CDN answers its
  `.heic` uploads as JPEG to every client, Googlebot-Image's name included);
  `IMAGE_FILENAMES_GENERIC` (IMG_0203, Screen-Shot-…, image-3, download (50) — 6, all right; a bare
  number is NOT one, moz numbers its authors' photos `/user/photo/10.jpg`); `VIDEO_WITHOUT_METADATA`
  (a YouTube/Vimeo/VK embed or a playable `<video>` with no VideoObject or og:video — 10; a muted
  `<video>` without controls is a background, semrush's home page loops one);
  `PREVIEW_IMAGE_TOO_SMALL` (the page's own image under 1,200 px, READ FROM THE FILE: the crawl
  fetches the first 64 KiB of og:image per post. Declared sizes were tried first and are not the
  image's — moz declares 1,050 px for an image it serves at 1,200, vc.ru declares 600 for a file
  of 1,200 or more. Measured: 4, a resized 683-px portrait copy on minimalistbaker, an 800×450
  preview on smashing, a 400×400 avatar); `PREVIEW_IMAGE_IS_LOGO` (og:image is the declared logo
  or a file named logo — 0); `AUTHOR_MARKUP_INCOMPLETE` (author as a bare string — gazeta.uz; a
  Person with `name: null` — habr; no url or sameAs — common, github.blog and blog.google among
  them; every url a home page; a prefix, the publisher — "Dana @ Minimalist Baker" — or several
  names in `name`. A sameAs list that OPENS with the site and then names the author passes: yoast
  writes exactly that, and reading only its first entry reported 11 yoast posts wrongly);
  `ARTICLE_DATE_FORMAT_INVALID` (not ISO 8601, or a time without a zone — 0);
  `ARTICLE_HEADLINE_MISMATCH` (under half the headline's words in the title or h1 — 0);
  `BREADCRUMB_INVALID` (warning: a step without position, name, or item before the last — 0; a
  trail of ONE step is not reported, Yoast writes a lone "Home" on every home page).
  `SNIPPET_RESTRICTED` also fails a `data-nosnippet` element holding most of the article. The
  extractor reads Microdata as Google does — types, the article item's properties and its
  author — so a Microdata article is no longer reported as missing structured data; RDFa is not
  read. Site checks, from the SERVED host's home page (one request, since a blog on a subdomain
  is another hostname to Google) and its icon (one more): `FAVICON_INVALID` (warning: none, an
  SVG-only icon, blocked for Googlebot-Image, not answered, not square, under 8 px — read from
  the file. A page declaring no icon is judged by `/favicon.ico`, which ghost.org and moz.com
  serve with no link at all; a declared icon that fails is no finding either while
  `/favicon.ico` is a usable icon (one request more), since what results show is then not in
  doubt — beachplumbingservices.com declares a theme icon that is gone, oborot.ru only an
  SVG, and both serve one at the root. A WebP or AVIF answer is a CDN negotiating, as dev.to's
  does, and no finding. Live: blog.cloudflare.com's 99×96 favicon.ico, on both audits);
  `SITE_NAME_NOT_DECLARED`
  (no WebSite name — 17 of 30); `SITE_NAME_INCONSISTENT` (WebSite name against og:site_name,
  neither among the alternate names — 1: blog.google, "News from Google" and "blog.google").
  A second audit ran the real pipeline — discovery, selection, the probes, the analysis —
  over 40 sites, small businesses among them (plumbers, estate agents, Bitrix and Tilda
  shops), 166 posts in sitemap order. Every firing was read, and the image sizes were
  measured again from the files outside this code: all seven agreed. `PREVIEW_IMAGE_TOO_SMALL`
  fired on 51 — older posts carry the small images of their day (dou.ua's 420×230, wpbeginner's
  680×385); `ARTICLE_DATE_FORMAT_INVALID` on smashingmagazine's `0001-01-01 00:00:00 +0000 UTC`,
  Hugo's zero time; `AUTHOR_MARKUP_INCOMPLETE` on shopify's "by Alicia Clark" (each author
  written twice in one node, now counted once). It also found a crash, in no check: a body cut
  at its cap was later aborted by its request's own timeout, and undici's error event on it
  had no listener left — the transport now keeps one (`UndiciHttpTransport`). No live page
  among the 224 read across both audits carries a TITLE_SCRIPT_MISMATCH, PREVIEW_IMAGE_IS_LOGO,
  ARTICLE_HEADLINE_MISMATCH, BREADCRUMB_INVALID or data-nosnippet wrapper; those five are
  proven by their specs alone.
  None reports what an older check already does. Where two could meet on one fact, the
  newer one steps aside, as STRUCTURED_DATA_INCOMPLETE does for STRUCTURED_DATA_MISSING: a
  date that does not read as one is ARTICLE_DATE_FORMAT_INVALID's alone (DATES_INCONSISTENT
  is not applicable to it, and both read the same declared dates — JSON-LD, `article:*`
  meta, Microdata); a page naming no author at all is AUTHOR_MISSING's alone (habr's
  nameless Person); a logo used as the page image is PREVIEW_IMAGE_IS_LOGO's alone, never
  also too small. STRUCTURED_DATA_MISSING and STRUCTURED_DATA_INCOMPLETE read Microdata too.
  "Steps aside" holds between checks of ONE owner. A Lighthouse audit that judges the same
  thing as one of ours is not a repeat to remove: both are recorded and both count, and
  `ISSUE_COUNTERPARTS` only puts them on one row of the screen (lighthouse-checks D11).
  Not built, for want of HTML that answers it or a line Google draws: CSS background images,
  keyword stuffing in titles and alt text (see the keyword-stuffing note above), meta
  descriptions written as keyword lists, title against h1, content hidden in tabs, interstitials,
  ad density, mobile usability beyond the viewport, image and video sitemaps, the Organization
  logo's size.
- **Three content checks from an agency's audit guidance (2026-10-11).** Asked for by the user
  after reading Productive Shop's enterprise audit checklist, content audit and AI-search
  study. All three are notices and judge only a text of THIN_CONTENT's 300 words or more, read
  from the same catalogue constant, because a short note needs no sections, picture or
  citation. `NO_SUBHEADINGS` is a long text under no `<h2>`–`<h6>`, backed by the starter
  guide's "provide headings to help users navigate". `NO_IMAGES` is a long text with no
  `<img>`, no frame or video, and no featured image, backed by the starter guide's "add images
  to your site"; the AI-search image counts are industry correlation and are called that.
  `NO_EXTERNAL_SOURCES` is a long text whose content links never leave the site's registered
  domain, backed by the helpful-content guidance's "clear sourcing". On the 43 recorded posts
  they fire 0, 1 and 1 times. Then a live audit — 104 pages on 34 sites (marketing and SaaS
  blogs, news, Ukrainian and Russian sites), each firing read against the raw HTML — found two
  defects, both fixed and pinned: css-tricks posts with five live CodePen demos and no `<img>`
  read as imageless, because the extractor drops every iframe before anything counted it (a
  frame now leaves an empty marker, counted with video, embed and object as `embeds`); and
  blog.hubspot.com's own `cta-redirect.hubspot.com` passed as an outside source, because hosts
  were compared by suffix (the registered domain is compared now). After the fixes they fire
  5, 10 and 16 times there; every firing read was real — Guardian and habr news with no
  subheading, dou and vercel posts with no image, HubSpot, habr, ain.ua and yoast posts that
  link outside their own domain nowhere — except one: a New York Times article whose server
  HTML carries no `<img>` because a script adds it, the limit every check shares by reading
  server HTML only.
  Built, measured live and removed the same day: `H1_LENGTH`, the checklist's 15–70
  characters. It fired on 35 of 104 live pages, 30 of them alongside TITLE_LENGTH because the
  h1 is usually the title, and the long end reported the ordinary 71–144-character headlines
  of the Guardian, CNN, HubSpot and Cloudflare — a house style. Narrowed to what was left (a
  short h1 in the content that is not the title) it fired on two product pages and no post.
  Also asked for and not built: images without width and height, rejected above; and "content
  not updated in N months", whose threshold no source gives.
- **What was considered and rejected.** `ORPHAN_PAGE` — "does anything link here" — cannot be
  answered by a crawl that visits the URLs a sitemap lists: the evidence is on pages this crawler
  never fetches, and the extractor removes the nav and the related-posts rail that carry most
  internal links. It would report an orphan on evidence we never had. Link-text quality is
  measured in `field-study-2026-10.md` and fires on effectively every page without `aria-label`
  and nested-alt handling. URL hygiene — underscores, length, parameter count — is finding 1
  again: a rule reporting a house style. Core Web Vitals and anything built on one server-side
  timing stay out for the reason `SLOW_RESPONSE` was retired: Core Web Vitals are measured
  by PageSpeed, never from an HTML timing, and the CWV risks above read markup. `llms.txt`
  is not a ratified standard and not a confirmed signal, and a check would manufacture the urgency the catalogue's
  wording is careful to avoid. HTTP cache validators (`ETag`, `Last-Modified`), which Google's
  crawler documentation recommends: measured live on 2026-10-09, three of five well-run blogs
  send neither and yoast's `Last-Modified` is the time of the request, so the check would report
  a house style and pass a value that validates nothing. Scroll-triggered lazy loading cannot be
  told from IntersectionObserver lazy loading in the HTML, and only the first is a problem.
  Soft 404s, HTTP→HTTPS and www normalisation are properties of the SITE, not of a page: they
  are site checks (`SOFT_404`, `HOST_VARIANT_SERVES_CONTENT`, `HOST_REDIRECT_CHAIN`) in
  `SITE_CHECK_CATALOGUE`, judged once per crawl from requests of their own.
  From the comparison with Ahrefs' recommendations (plan `ahrefs-gap-checks`, D2, D33):
  an empty `alt=""` is correct markup for a decorative image (WCAG), not a miss; "not
  updated for N months" would push authors to bump dates, the very thing
  `DATE_BUMPED_WITHOUT_CHANGES` flags; three to five links per post, "no outbound links" as
  a count, and generic image names in Ahrefs' broad form are house style, as URL hygiene is
  (`IMAGE_FILENAMES_GENERIC` and `NO_EXTERNAL_SOURCES` stay: they report the narrower,
  measured forms); `srcset` and image formats read from markup guess without the CSS, as
  images without width and height did, and Lighthouse measures them; `x-default` is optional
  by Google's own words; the Lighthouse SEO category repeats this catalogue; a WAF probe
  with an AI bot's user agent would be blocked as a fake bot, since Cloudflare verifies those
  bots by IP — a finding on evidence we do not have, as `ORPHAN_PAGE` would be.
  `CANONICAL_CHANGED` was planned and dropped: the canonical's current state is already
  reported — self to other by `CANONICAL_MISMATCH`, removal by `CANONICAL_MISSING` — so
  without repeating them it could fire only on other to self, which is a fix.
- **Seven checks from Ahrefs' recommendations, one fact one finding (2026-10-11).** Plan
  `ahrefs-gap-checks` compared the catalogue with Ahrefs' audit, on-page, technical and
  canonical guidance and admitted what clears D1's bar: a first-party source at any
  severity, an industry one (`INDUSTRY_SOURCE_HOSTS`) only as a notice — a contracts test
  holds that half. `CANONICAL_TO_HTTP` (the page's own http:// twin as its canonical),
  `OG_URL_MISMATCH`, `META_DESCRIPTION_REPEATS_TITLE`, `BREADCRUMB_MISSING`,
  `TITLE_YEAR_OUTDATED` (read in the owner's zone, `ICheckInput.timeZone`),
  `HREFLANG_NO_SELF_REFERENCE` (the arm moved out of `HREFLANG_INVALID`), and the site check
  `CONTENT_NEEDS_JAVASCRIPT`, which counts the structured `clientRendered` flag of skipped
  posts and never their reason text. Where a new check met an older one on the same fact,
  one steps aside: `CANONICAL_MISMATCH` for the http twin, `OG_URL_MISMATCH` for a
  development-host og:url; the sitemap check reads `CANONICAL_TO_HTTP` as it reads
  `CANONICAL_MISMATCH`, so the step-aside loses no entry. `META_DESCRIPTION_REPEATS_TITLE`
  and `META_DESCRIPTION_LENGTH` both fire on a copied title: length and content are two facts.
- **Field audit of the Ahrefs-gap checks (2026-10-11).** Two passes through the real
  pipeline on 56 live sites (WordPress, Ghost, Next.js, Substack, Blogger, news, recipes,
  Russian and Uzbek sites, multilingual ones; the 2026-10-09 list is not in the repository,
  so the sites are named in the plan), 50 reached, 256 posts. Every firing was read against
  the page. Fired / wrong after the fixes below: `CANONICAL_TO_HTTP` 0 of 244 judged;
  `OG_URL_MISMATCH` 5 / 0 (cossa.ru's og:url names the old http address, which 301s to the
  served one); `META_DESCRIPTION_REPEATS_TITLE` 0 of 237; `BREADCRUMB_MISSING` 107 / 0 (each
  page's HTML searched for any BreadcrumbList, JSON-LD, Microdata or RDFa);
  `TITLE_YEAR_OUTDATED` 0 of 256; `HREFLANG_NO_SELF_REFERENCE` 0 of 43;
  `CONTENT_NEEDS_JAVASCRIPT` 0 of 50 sites. A check that never fired is held by its spec's
  failing cases, not by the field. Two false findings were found and fixed: Substack's
  site-wide "requires JavaScript" `<noscript>` banner made its paywalled posts look like
  shells (the banner now counts only in a body of at most 20 words), and vercel.com's
  BreadcrumbList lives in the Next.js payload, written by React in the browser where Google
  reads it (`scriptedSchemaTypes`; the check is not applicable to it). The same payload
  carries vercel.com's Article markup, which `STRUCTURED_DATA_MISSING` does not yet consult.
- **Four checks that ask other pages, through the crawl's `outbound` stage (2026-10-11).**
  The crawl asks the content links, the canonical target and the hreflang alternates for their
  answer before analysis runs (`IOutboundFacts`), so the checks stay pure:
  `BROKEN_LINKS` and `LINKS_TO_REDIRECTS` judge the links in the text,
  `CANONICAL_TARGET_BROKEN` a canonical whose target redirects, answers an error, is noindexed
  or is itself canonicalised elsewhere, and `HREFLANG_NOT_RECIPROCAL` an alternate that does not
  name this page back. What a link's answer means is one function, `linkVerdictOf`. Inside the
  site, any 4xx or 5xx is broken, except 401/402/403/429, which refuse the crawler rather than
  describe the page. A redirect is its own finding. Outside the site only 404, 410 or a domain
  that does not exist is broken (`EXTERNAL_BROKEN_STATUSES`): 401, 403, 429, LinkedIn's 999,
  any 5xx and a timeout are what bot walls send crawlers and never readers, and a redirect is
  the other site's arrangement. An answer reached through a third host — a consent wall, a
  geo gate — is unknown, and Cloudflare's `/cdn-cgi/` addresses are no pages. Whatever the
  crawl could not ask (its budget, robots.txt, the deadline) is said to be unchecked with the
  reason, never counted as fine. One fact, one finding:
  - `CANONICAL_MISMATCH` steps aside for a broken target (one predicate,
    `canonicalTargetProblemOf`);
  - `LINKS_TO_REDIRECTS` skips what `INTERNAL_LINK_VARIANTS` reports, and that check leaves a
    dead link to `BROKEN_LINKS`;
  - every link check skips a development host, which `DEVELOPMENT_HOST_REFERENCES` reports;
  - `HREFLANG_NOT_RECIPROCAL` skips the codes `HREFLANG_INVALID` reports (one validator,
    `_shared/hreflang-code.ts`) and is not applicable when the canonical names another page.
- **Field audit of the outbound checks (2026-10-11).** The first pass ran 32 live sites
  (blog.cloudflare.com, kinsta.com, semrush.com, moz.com, blog.hubspot.com, ahrefs.com,
  smashingmagazine.com, backlinko.com, css-tricks.com, yoast.com, gazeta.uz, kun.uz, habr.com,
  techcrunch.com, seths.blog, lifehacker.ru, deepl.com, kottke.org, notion.com,
  wpbeginner.com, 404media.co, ghost.org, blog.duolingo.com, react.dev, sitepoint.com,
  zapier.com, vc.ru, cossa.ru, unisender.com, neilpatel.com, texterra.ru, hostinger.com) through
  discovery, selection, the outbound stage and analysis, 6 posts each. It found four kinds of
  false finding, each fixed with a spec from the site:
  - an internal 429 or 403 refuses the crawler, not the page (moz.com, css-tricks.com), so
    401/402/403/429 inside the site read as unknown. This is the sitemap check's refusal set,
    and closes the plan's O3;
  - backlinko.com's `/hub/` links leave the site for a host that walls crawlers off, and
    youtube.com channels end on 404 through consent.youtube.com. An internal link that leaves
    the site is judged as external, and any answer reached through a third host is unknown;
  - Cloudflare's `/cdn-cgi/` e-mail protection links are no pages (techcrunch.com);
  - a dead link that is also a variant was reported twice (cossa.ru), so it is now
    `BROKEN_LINKS`' alone.

  The second pass ran the same sites after the fixes: 29 reached (yoast.com now challenges
  this crawler's address at robots.txt, kun.uz and sitepoint.com yielded no post), 160 posts,
  plus a full stack crawl of semrush.com. Each firing was read against the live URL in a
  browser-like request:
  - `BROKEN_LINKS`: 27 fired, 0 wrong. It includes vc.ru's tag pages, which answer every
    client 500 (`Invalid character in header content ["location"]`), and amazon.com skill
    pages whose canonical `/dp/` URL answers "couldn't find that page". A plain fetch of those
    Amazon pages shows a captcha with 200.
  - `LINKS_TO_REDIRECTS`: 72 fired, 0 wrong (122 distinct links; every first hop matched and
    every target answered).
  - `CANONICAL_TARGET_BROKEN`: 0 of 154 judged.
  - `HREFLANG_NOT_RECIPROCAL`: 0 of 27 judged.

  Because `CANONICAL_TARGET_BROKEN` never fired, its step-aside removed no
  `CANONICAL_MISMATCH`. The two silent checks are held by their specs' failing cases.
- **Two checks are deliberately absent.** `SLOW_RESPONSE` measured the crawler's network position
  rather than the page, and `KEYWORD_NOT_IN_TITLE` could not fail by construction. The
  measurements are in `practices/search-engines/references/field-study-2026-10.md`, findings 3 and
  4; they are not repeated here. Any future check built on a single server-side timing is the same
  mistake.
- **Heading text excludes chrome.** The extractor removes accessibility-only labels and the
  controls inside headings before reading, and inserts block separators BEFORE collecting rather
  than after. vercel.com fuses a copy-link control into every `<h2>`; without this the page's
  keywords came back as `headingagentic infrastructure` (same field study, finding 7). No fixture
  written from clean HTML catches it, which is why the case in `extract-page.spec.ts` is written
  from the real markup shape.
- **Tunables** are constants in `constants/keyword-scoring.constant.ts`; the golden test on the
  recorded yoast posts pins their combined effect (a slug phrase in the top 3 of ≥ 12 of 15 pages,
  "yoast" in no keyword at all, nothing under the floor, no two keywords covering the same words).
  Every number there is a judgement call standing on pages this repository has looked at, and the
  comment beside each one says which page moved it; `practices/search-engines/SKILL.md` is why
  none of them can be anything better than that.
- **Not done: one word, several forms.** Terms are matched as written, so an inflected language
  splits its own evidence — `октябрь` in the title and `октября` seven times in the text are two
  candidates, each ranked lower than the one word deserves. It needs a stemmer per target
  language, and which languages are targets is undecided; see "Not done, and next" in the root
  README.

## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable — ANALYSIS-011 is deposited above, beside the prose it belongs to. Unless another path is
named, the requirement lives in `openspec/specs/be/src/modules/page-analysis/spec.md`.

<!-- invariant: ANALYSIS-001 -->

**Issues come only from the shared catalogue: one check per crawl-owned code and none for a speed code, one issue per code on a page, and the code decides both the check’s shape and its return shape.** Pinned by `services/checks/checks.registry.spec.ts` -> "has exactly one check per crawl-owned code", "has no check for a pageSpeed-owned code", "registers every check under the code it carries", "gives a check the shape its catalogue scope calls for" and "emits only catalogued codes over every recorded page"; the unique index `seo_issues_page_id_code_uq`. The return-shape half is `pnpm typecheck` over the mapped type, not a test.

<!-- invariant: ANALYSIS-002 -->

**The seventy-four crawl checks, their thresholds and their severities, each finding saying exactly what is wrong and quoting the evidence for it.** Pinned by the per-check specs under `services/checks/` (one `<code>.check.spec.ts` per crawl-owned code, except the five HTML Core Web Vitals risks, which share `cwv-risks.check.spec.ts`; the thirteen speed codes have no check and are pinned by `cwv-issues-of.spec.ts` and `speed-issues-of.spec.ts`), `checks.registry.spec.ts` -> "reports catalogue severity, with a run finding in its catalogue place" and "lets every check fail, and every failure carry evidence", and `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts` -> "explains every check in more than one sentence" and "backs every check with at least one https source".

<!-- invariant: ANALYSIS-003 -->

**The page title is `head > title` only; a `<title>` inside an SVG in the body is not the page title.** Pinned by `services/html-extraction/extract-page.spec.ts` -> "reads the title from <head>, never from an SVG in the body (semrush)".

<!-- invariant: ANALYSIS-004 -->

**Keyword candidates are normalized main-content phrases that never begin or end with a stop word.** Pinned by `services/keyword-extraction/collect-candidates/collect-candidates.spec.ts` -> "never starts or ends a candidate with a stop word" and "without a known language, stops at 2-grams and filters nothing"; `tokenize/tokenize.spec.ts` -> "normalizes and splits on sentence breaks".

<!-- invariant: ANALYSIS-005 -->

**Candidates are scored by field weight with subsumed duplicates removed, and the page keeps at most eight above the floor — never topped up to a minimum.** Pinned by `score-candidates/score-candidates.spec.ts` -> `describe("pageScore")`; `select-keywords/select-keywords.spec.ts` -> "keeps at most 8 above the floor, the top at relevance 1"; `extract-keywords/extract-keywords.spec.ts` -> "gives every page 1–8 keywords, the top at relevance 1".

<!-- invariant: ANALYSIS-006 -->

**Scores are damped by an IDF factor over the run’s pages, so a term on every page of a site fades.** Pinned by `score-candidates/score-candidates.spec.ts` -> `describe("idfFactor")` -> "is below 0.3 for a term on every page of 15, and 1 for a term on one of them"; `extract-keywords.spec.ts` -> "never returns the brand word at all".

<!-- invariant: ANALYSIS-008 -->

**A bounded code’s finding is a measurement carrying the bounds that were in force when the page was crawled, not today’s.** Pinned by `packages/contracts/src/domain/seo/measured-issue-codes.test.ts` -> "holds every catalogue entry that declares a min or a max"; `services/checks/title-length/title-length.check.spec.ts` -> the "at %d characters" cases; `be/test/e2e/pages.e2e-spec.ts` -> "the detail carries its score, the fetch time and a measured finding".

<!-- invariant: ANALYSIS-009 -->

**The extractor reads headings and blocks as a reader sees them: assistive-only text and in-heading controls contribute nothing.** Pinned by `services/html-extraction/extract-page.spec.ts` -> "a copy-link control inside an h2 is not part of the heading (vercel.com)", "an element hidden from assistive technology contributes no text", "separates adjacent blocks so their words never fuse".

<!-- invariant: ANALYSIS-010 -->

**Every check answers pass, not applicable, or a finding, and the page stores both check counts.** Pinned by `services/checks/checks.registry.spec.ts` -> "finds nothing on two clean, unrelated pages, and applies every check", "does not count against a page a check that could not be judged", "keeps checksFailed equal to the number of issues"; the CHECKs `pages_checks_failed_range` and `pages_checks_applicable_positive`.

<!-- invariant: ANALYSIS-012 -->

**Every catalogue code names the one writer that owns it — the crawl or the PageSpeed worker; the two code sets are derived from that, disjoint and complete, and each writer replaces only its own codes.** Pinned by `packages/contracts/src/domain/seo/seo-issue-catalogue.test.ts` -> "partitions the catalogue by owner: every code in exactly one writer's set", "gives the PageSpeed worker exactly the six Core Web Vitals codes", "each CWV code's max is its metric's threshold for its band" and "makes a poor metric a warning and one that needs improvement a notice"; `be/src/modules/pages/repositories/seo-issues/seo-issues.repository.int-spec.ts` -> "a crawl's replace leaves the page's speed findings" and "a speed replace leaves the page's crawl findings". An entry without an owner is `pnpm typecheck` (the field is required), not a test.

<!-- invariant: ANALYSIS-013 -->

**Every page, speed and site entry explains itself in a plain what / why / fix, without markup, within its bounds, the fix naming who acts — beside the curated fields, never in place of them.** Pinned by `packages/contracts/src/domain/seo/issue-plain-copy.test.ts` -> "covers every page, speed and site entry", "%s carries what, why and fix", "%s has no < or > in its plain copy", "%s stays within its bounds" and "%s says in its fix who does it" (bounds and audience words in `plain-copy.interface.ts`). That the curated label, hint and explanation were not rewritten is NOT pinned by a test — it was checked once, by diff, when the copy landed. The tone is not testable at all.
