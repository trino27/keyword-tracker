# be/src/modules/page-analysis Specification

## Purpose
What is read out of one crawled page: the SEO issues it has against the shared
catalogue, and the phrases it presents itself as being about.

## Requirements

### Requirement [ANALYSIS-001]: issues come only from the shared catalogue, and every crawl-owned code has a check

Every SEO issue MUST carry a code defined in `SEO_ISSUE_CATALOGUE` in `@app/contracts`, with the
severity the catalogue gives it; every code the catalogue gives to the crawl MUST have exactly one
check, a code the catalogue gives to another writer MUST have none, and a page MUST have at most
one issue per code. A check MUST carry the code it is registered under. What a check READS and
what it may RETURN are both decided by the code: a code the catalogue marks `scope: 'run'` reads
the whole crawl and answers once per page, every other code reads one page and answers once; a
code whose catalogue entry declares a bound returns a measurement — the value as found and the
bounds it was judged against — and every other code returns details.

AMENDED during implementation (`seo-check-catalogue-correction`, task 5.1): this requirement said
a rule's outcome was "details or null". That was true of a catalogue in which every finding was
shaped alike. It is not true once a threshold rule has to explain the verdict it reached: the
bounds are snapshotted into the row at crawl time, so an old finding still reads correctly after
the catalogue's numbers move. The sentence above now says which shape belongs to which code, and
the mapped type `{ [K in TSeoIssueCode]: TCheck<K> }` is what makes returning the other one
fail to compile.

AMENDED during implementation (`seo-check-units`): the two registries this requirement described —
one for page-scoped rules, one for run-scoped ones — are a single `CHECKS` record of units, each a
file carrying its own code and its own `evaluate`. The guarantee is unchanged and strengthened: the
mapped type still fails to compile on a missing code, and now also on a check registered under the
wrong code or given the wrong shape for its scope.

Modified by `issue-catalogue-owners`: the catalogue now holds codes the crawl does not write — the
Core Web Vitals codes, written by the PageSpeed worker from Google's measurements. A check for one
of them could only guess from HTML at what Google measured in a browser. "Every catalogued code has
a check" becomes "every crawl-owned code has a check", and the mapped type is keyed by
`TCrawlIssueCode`, so a missing crawl check and a check under a speed code both fail to compile.

#### Scenario: analysing every fixture page
- **WHEN** the analyser runs over every recorded and synthetic fixture page
- **THEN** every emitted code is a crawl-owned catalogue key

#### Scenario: a crawl-owned catalogue entry without a check
- **WHEN** a code owned by the crawl is added to the catalogue and no check is registered for it
- **THEN** `pnpm typecheck` fails

#### Scenario: a check registered under a speed code
- **WHEN** a check is registered in `CHECKS` under a code the catalogue gives to the PageSpeed worker
- **THEN** `pnpm typecheck` fails

#### Scenario: a check registered under another code
- **WHEN** a check carrying one code is registered in `CHECKS` under a different one
- **THEN** `pnpm typecheck` fails

#### Scenario: a check whose shape does not match its scope
- **WHEN** a code the catalogue marks `scope: 'run'` is given a check that reads one page
- **THEN** `pnpm typecheck` fails

#### Scenario: a threshold check returning loose details
- **WHEN** a check for a bounded code returns anything but `{ value, min?, max? }`
- **THEN** `pnpm typecheck` fails

### Requirement [ANALYSIS-002]: the SEO rules and their thresholds

The analyser MUST report: TITLE_MISSING (error); TITLE_LENGTH below 30 or above 60 characters
(notice); META_DESCRIPTION_MISSING (warning); META_DESCRIPTION_LENGTH below 70 or above 160
(notice); H1_MISSING (error); H1_MULTIPLE (warning); HEADING_SKIP (notice); CANONICAL_MISSING
(warning); CANONICAL_MISMATCH (notice); NOINDEX by meta robots or `X-Robots-Tag` (error);
IMAGES_MISSING_ALT (warning); THIN_CONTENT below 300 words (warning); LANG_MISSING (notice);
OG_TAGS_MISSING (notice); NOT_HTTPS (error); REDIRECTED (notice); LARGE_PAGE above 1 MB of HTML
(notice); STRUCTURED_DATA_MISSING when the page declares no `Article` or `BlogPosting` type
(notice). Each issue's details MUST say what exactly is wrong.

AMENDED during implementation (`seo-check-catalogue-correction`, task 5.1): this requirement
listed nineteen codes, two of which the field study of 2026-10-03
(`practices/search-engines/references/field-study-2026-10.md`) falsified by measurement.

  * SLOW_RESPONSE measured the crawler's network position, not the page — the same site answered
    in 41 ms and 1728 ms minutes apart (finding 3). The number stays, as a stated fact of the
    crawl on the detail screen; the check does not.
  * KEYWORD_NOT_IN_TITLE could not fail by construction and fired 0 of 15 (finding 4): title
    presence is the largest field weight in keyword scoring, so the top keyword is nearly always
    a title term.
  * STRUCTURED_DATA_MISSING replaces them because it is the one uncovered check that actually
    varied on real data (finding 8), and `jsonLd.types` was already extracted and discarded.
  * TITLE_LENGTH moves from warning to notice: the research confirmed the numbers and showed
    that exceeding them is not a breakage.

The scenario's details also moved from `{ length: … }` to the measurement shape ANALYSIS-001 now
requires. Eighteen codes.

#### Scenario: a 61-character title
- **WHEN** a page's title is 61 characters
- **THEN** TITLE_LENGTH is reported as a notice with details `{ value: 61, min: 30, max: 60 }`

#### Scenario: a page declaring only Organization
- **WHEN** a page's JSON-LD declares `Organization` and `BreadcrumbList` and no article type
- **THEN** STRUCTURED_DATA_MISSING is reported as a notice

#### Scenario: a decorative image
- **WHEN** an image in the main content has `alt=""`
- **THEN** it does not count towards IMAGES_MISSING_ALT

### Requirement [ANALYSIS-003]: the page title is the document's head title

The title used for rules and keywords MUST be read from `<head><title>` only; a `<title>` inside
inline SVG in the body MUST be ignored.

#### Scenario: Semrush's SVG title
- **WHEN** a Semrush post with an SVG `<title>` in its body is analysed
- **THEN** the page title is the head title

### Requirement [ANALYSIS-004]: keyword candidates are clean on-page phrases

Keyword candidates MUST be 1–4-word phrases from the page's main content and fields (navigation,
header, footer, aside and scripts removed), normalized (NFKC, lower case, punctuation stripped,
whitespace collapsed), never starting or ending with a stop word of the page's language; with an
unknown language no stop words apply and phrases are at most 2 words.

#### Scenario: a phrase ending with "the"
- **WHEN** a heading reads "Optimize the"
- **THEN** "optimize the" is not a candidate

### Requirement [ANALYSIS-005]: each page keeps up to 8 of its most relevant phrases

Candidates MUST be scored by field weight (title 5 with the brand suffix removed, h1 4, URL slug 3,
meta description 2, h2/h3 2, first paragraph 1.5, body 1), a bonus for presence in several strong
fields, a small bonus for declared metadata (JSON-LD keywords, `article:tag`), with subsumed
duplicates removed; at most 8 above the floor are kept, and no page is topped up to a minimum — a page
with one subject keeps one phrase — with relevance
in (0, 1] where the top keyword is 1.

#### Scenario: a typical post
- **WHEN** a recorded Yoast post is analysed in its run
- **THEN** it has between 5 and 8 keywords, the first with relevance 1, and its slug phrase among the top 3

### Requirement [ANALYSIS-006]: site-wide terms fade

Scores MUST be multiplied by an IDF factor over the run's pages, `ln(1 + N/df) / ln(1 + N)`, so a
term present on every page of the run ranks below page-specific terms; with one page the factor is 1.

#### Scenario: the brand on every page
- **WHEN** "yoast" appears on all 15 pages of a run
- **THEN** it is not in any page's top 3 keywords

### Requirement [ANALYSIS-007]: a re-crawl refreshes its own analysis without deleting another writer's

A re-crawl MUST replace the crawl-owned issues of each page it fetched AND refresh that page's two
check counters in the same act, MUST NOT delete or alter a finding under a code another writer
owns, MUST insert new page-keyword pairs, update the relevance and `last_seen_run_id` of surviving
pairs, and MUST NOT delete any pair; analysis MUST run once per run, after all its pages are
fetched.

AMENDED during implementation (`page-health-score`, task 5.1): the requirement covered the issues
and the pairs, which was the whole of a page's analysis when it was written. A page now also
carries the counters its score is derived from, and they are part of the same verdict: refreshed
issues beside counters left at their first value would show a score that contradicts the issue
list printed next to it. "In the same act" is the requirement, not an implementation note — the
counters are columns of the same upsert, inside the same transaction as the issue rows.

Modified by `issue-catalogue-owners`: "replace the issues" deleted every finding of the page, which
was the same thing while the crawl was the only writer. With the PageSpeed worker writing speed
findings into the same table, it would erase them on every re-crawl and leave a red badge with no
issue behind it until the next measurement. The crawl now replaces only what it owns.

#### Scenario: a keyword drops out
- **WHEN** a re-crawled page no longer yields a keyword it had
- **THEN** the pair row and its snapshots remain, with the earlier `last_seen_run_id`

#### Scenario: a re-crawl finds fewer problems
- **WHEN** a page that failed 7 of 18 checks is re-crawled and now fails 2 of 16
- **THEN** its stored counters are 16 and 2, not the earlier pair

#### Scenario: a page carrying a speed finding is re-crawled
- **WHEN** a page holds `CWV_LCP_POOR` and a crawl re-fetches it with no crawl findings at all
- **THEN** the page's crawl findings are gone and `CWV_LCP_POOR` is still stored

### Requirement [ANALYSIS-011]: one pass records which checks it judged and which it could not

The analysis MUST record, for each page and in the same single pass that produces its issues, the
catalogue codes whose check reached a verdict and the codes whose check could not be judged on that
page. The two lists MUST be disjoint, MUST each hold a code at most once, and their union MUST be
exactly the catalogue that ran — the crawl-owned catalogued codes the catalogue had not retired at
the time of that crawl. A code whose check can answer "not applicable" MUST declare, in the shared
catalogue, the reason it can be skipped.

AMENDED during implementation (`seo-check-units`): "the catalogue that ran" now also excludes a
code retired with `enabled: false`. A retired code keeps its catalogue entry, so findings already
stored under it stay readable; it is simply not evaluated and not listed. A page crawled before the
retirement keeps the code in its stored lists and therefore in its denominator, which is why the
score is explained as what applied when the page was crawled.

Modified by `issue-catalogue-owners`: "the catalogue that ran" excludes the codes another writer
owns. A speed code is not run by the crawl; in either stored list it would put Google's
measurement into the SEO score's denominator, which the score must never contain.

#### Scenario: a page with no meta description and no images

- **WHEN** the checks are evaluated against it
- **THEN** META_DESCRIPTION_LENGTH and IMAGES_MISSING_ALT are in the not-applicable list, every
  other active crawl-owned code is in the judged list, and no code is in both

#### Scenario: the two lists over every recorded page

- **WHEN** the checks are evaluated against each recorded fixture post
- **THEN** the number of judged codes plus the number of not-applicable codes equals the number of
  active crawl-owned catalogue codes, and every not-applicable code is one the catalogue declares
  as conditional

#### Scenario: a speed code in the stored lists

- **WHEN** a crawl stores a page
- **THEN** neither of its lists holds a code the PageSpeed worker owns

#### Scenario: a retired check

- **WHEN** a catalogue entry is marked `enabled: false` and a page is crawled
- **THEN** that code is in neither list, it is not listed on the page's checks, and a finding
  stored under it by an earlier crawl still renders with its label, hint and severity

#### Scenario: a rule learns to skip without a declared reason

- **WHEN** a rule is changed to answer "not applicable" for a code whose catalogue entry declares
  no skip reason
- **THEN** the test that compares the skipped set with the catalogue's conditional set fails

### Requirement [ANALYSIS-010]: a rule answers pass, not applicable, or a finding, and the page stores both counts

Every rule MUST return one of three outcomes — the check passed, the check could not be judged on
this page, or the check failed with its finding — and the analysis MUST store, on the page and in
the same act that stores its issues, how many checks could be judged and how many of those
failed. Applicability MUST be decided while the parsed page is in hand, because the stored page
row holds no canonical, no Open Graph and no JSON-LD and cannot answer the question later.

#### Scenario: a page with no meta description

- **WHEN** a page declares no meta description
- **THEN** META_DESCRIPTION_MISSING fails, META_DESCRIPTION_LENGTH is not applicable, and the page's applicable count excludes it

#### Scenario: the counts agree with the issue rows

- **WHEN** a crawl stores a page with three issues
- **THEN** its stored failed count is 3, and its applicable count is between 13 and 18

#### Scenario: an impossible pair of counts

- **WHEN** a write attempts a failed count greater than the applicable count
- **THEN** the database rejects it and the run's finalize aborts rather than storing an impossible score

### Requirement [ANALYSIS-008]: a threshold finding carries the value and the bounds it was judged against

A rule for a code whose catalogue entry declares a `min` or a `max` MUST report its finding as a
measurement `{ value, min?, max? }`, and those bounds MUST be the ones in force when the page was
crawled, written into the stored row; a rule for a code with no declared bound MUST keep plain
details. The set of measured codes MUST be derived from the catalogue, never listed a second time.

#### Scenario: a 61-character title

- **WHEN** a page's title is 61 characters and the catalogue declares 30–60
- **THEN** TITLE_LENGTH is stored with details `{ value: 61, min: 30, max: 60 }`

#### Scenario: a threshold is widened after the crawl

- **WHEN** the catalogue's title maximum is later changed to 65 and the page is not re-crawled
- **THEN** the stored finding still reads 61 against 30–60, so the verdict and its justification agree

#### Scenario: a bounded code added without its measurement

- **WHEN** a catalogue entry declaring a `min` is added and its rule returns plain details
- **THEN** `pnpm typecheck` fails

### Requirement [ANALYSIS-009]: the extractor reads heading text as a reader sees it

Text that exists only for assistive technology, and controls placed inside a heading, MUST NOT
become part of a heading, a content block or a keyword candidate; adjacent elements MUST be
separated before any text is read, so two neighbouring strings never fuse into one word.

#### Scenario: a copy-link control inside a heading

- **WHEN** a page's `<h2>` contains a control labelled "Copy link to heading" before the text "Agentic infrastructure"
- **THEN** the extracted heading is exactly "Agentic infrastructure" and no keyword begins with "heading"

#### Scenario: an element hidden from assistive technology

- **WHEN** a `<span aria-hidden="true">` sits inside a paragraph of the main content
- **THEN** its text contributes neither to the block nor to the word count

### Requirement [ANALYSIS-012]: every catalogue code names the one process that writes it

Every entry of `SEO_ISSUE_CATALOGUE` MUST declare its owner — the crawl or the PageSpeed worker —
and the set of codes each owner writes MUST be derived from those declarations, never listed a
second time. The two sets MUST be disjoint and together MUST be the whole catalogue. A writer MUST
replace only the findings under codes it owns.

#### Scenario: an entry added without an owner

- **WHEN** a catalogue entry is added with no `owner`
- **THEN** `pnpm typecheck` fails

#### Scenario: the partition

- **WHEN** the crawl's codes and the PageSpeed worker's codes are listed from the catalogue
- **THEN** no code is in both and every catalogue code is in one

#### Scenario: the Core Web Vitals codes

- **WHEN** the catalogue is read
- **THEN** `CWV_LCP_POOR`, `CWV_INP_POOR` and `CWV_CLS_POOR` are owned by the PageSpeed worker
  with severity warning, the three `…_NEEDS_IMPROVEMENT` codes are owned by it with severity
  notice, and each declares as its `max` the threshold of `CWV_THRESHOLDS` its band begins above

### Requirement [ANALYSIS-013]: every finding explains itself to a marketer in three plain parts

Every entry of the page catalogue and of the site catalogue MUST carry, beside its curated label,
hint, explanation and sources, a plain `what` (the problem in one sentence), `why` (its cost in
visibility, traffic or clicks) and `fix` (what to do, naming who does it — an editor in the CMS, an
SEO plugin, a developer, the host). None of the three MAY contain markup characters, and each MUST
stay within its declared length bounds. The curated fields MUST NOT be rewritten to serve as plain
copy.

#### Scenario: an entry added without plain copy
- **WHEN** a catalogue entry is added with no `plain`
- **THEN** `pnpm typecheck` fails

#### Scenario: a fix that names nobody
- **WHEN** an entry's `fix` names no one who would act
- **THEN** the plain-copy test fails

#### Scenario: a fix that quotes a tag
- **WHEN** an entry's `fix` says "add a <title> tag"
- **THEN** the plain-copy test fails on the markup character

### Requirement [ANALYSIS-014]: an industry-only check is at most a notice

A catalogue entry, page or site, whose every source is published by an industry vendor and none
by a first party (Google, a W3C or WHATWG specification, MDN, web.dev, Lighthouse, ogp.me) MUST
have severity notice. The industry hosts MUST be listed once, and the rule MUST be checked
against every entry of both catalogues by a test, never by review alone.

#### Scenario: an Ahrefs-only check written as a warning
- **WHEN** an entry whose only source is an ahrefs.com article is given severity warning
- **THEN** the contracts test fails, naming the code

#### Scenario: an industry source beside a first-party one
- **WHEN** an entry cites an Ahrefs article and a Google Search Central page and is a warning
- **THEN** the test passes

### Requirement [ANALYSIS-015]: a canonical naming the page's own http:// twin is reported once, as that

A page served over HTTPS whose first declared canonical — `<head>` before the Link header — is the
page's own address over plain HTTP (the same document once its scheme is https) MUST be reported
as `CANONICAL_TO_HTTP`, a warning, quoting the declaration, and in exactly that case
`CANONICAL_MISMATCH` MUST be not applicable. An http canonical naming a different address MUST
be `CANONICAL_MISMATCH`'s alone, with `CANONICAL_TO_HTTP` not applicable. A page with no
canonical, or one served over plain HTTP, MUST NOT be judged by `CANONICAL_TO_HTTP`. Both checks
MUST decide "the http twin" with one shared predicate.

#### Scenario: an HTTPS post naming its HTTP twin
- **WHEN** `https://a.example/post/` declares `<link rel="canonical" href="http://a.example/post/">`
- **THEN** `CANONICAL_TO_HTTP` is reported with the declaration as evidence, and
  `CANONICAL_MISMATCH` is not applicable

#### Scenario: an http canonical naming another page
- **WHEN** `https://a.example/post/` declares `http://a.example/other/` as its canonical
- **THEN** `CANONICAL_MISMATCH` is reported, and `CANONICAL_TO_HTTP` is not applicable

#### Scenario: a page served over HTTP
- **WHEN** the page itself is served at `http://a.example/post/`
- **THEN** `CANONICAL_TO_HTTP` is not applicable

### Requirement [ANALYSIS-016]: og:url that names another URL than the page's canonical is reported

A page whose `og:url`, resolved against the page, is not the same document as its first declared
canonical — or as the URL it was served at when it declares none — MUST be reported as
`OG_URL_MISMATCH`, a notice. A page without `og:url`, or whose `og:url` names a development,
staging or preview host, MUST NOT be judged by this check: the latter is
`DEVELOPMENT_HOST_REFERENCES`'s finding, decided by the same predicate that check uses for what
names the page itself.

#### Scenario: a staging og:url
- **WHEN** a post's og:url is `https://staging.a.example/post/`
- **THEN** `OG_URL_MISMATCH` is not applicable, and `DEVELOPMENT_HOST_REFERENCES` reports it

#### Scenario: a template that writes the home page into og:url
- **WHEN** a post's canonical is `https://a.example/post/` and its og:url is `https://a.example/`
- **THEN** `OG_URL_MISMATCH` is reported quoting both

#### Scenario: a trailing-slash difference
- **WHEN** og:url is `https://a.example/post` and the canonical `https://a.example/post/`
- **THEN** the check passes

### Requirement [ANALYSIS-017]: a meta description that only repeats the title is reported

A page whose meta description, normalised (NFKC, lower case, punctuation removed, whitespace
collapsed), equals its title — whole or without the brand suffix after ` | `, ` – `, ` — ` or
` - ` — MUST be reported as `META_DESCRIPTION_REPEATS_TITLE`, a notice. A page lacking either
MUST NOT be judged by this check. `META_DESCRIPTION_LENGTH` MUST still judge the same description:
content and length are two facts, and a copied title being short does not make them one.

#### Scenario: a copied title that is also short
- **WHEN** the description is a 40-character copy of the title
- **THEN** both `META_DESCRIPTION_REPEATS_TITLE` and `META_DESCRIPTION_LENGTH` are reported

#### Scenario: a CMS that copies the title
- **WHEN** the title is "Link building guide | Acme" and the description "Link building guide."
- **THEN** `META_DESCRIPTION_REPEATS_TITLE` is reported

#### Scenario: a description that adds to the title
- **WHEN** the description is "Link building guide: what works for small sites in practice"
- **THEN** the check passes

### Requirement [ANALYSIS-018]: a post with no breadcrumb markup is reported

A page whose JSON-LD and Microdata declare no `BreadcrumbList`, including a `BreadcrumbList`
inside an `@graph`, MUST be reported as `BREADCRUMB_MISSING`, a notice. A page that declares one,
however incomplete, MUST pass this check; an incomplete one is `BREADCRUMB_INVALID`'s.

#### Scenario: Yoast's graph
- **WHEN** a post's JSON-LD `@graph` holds a `BreadcrumbList`
- **THEN** the check passes

#### Scenario: no breadcrumb anywhere
- **WHEN** a post declares an `Article` and nothing else
- **THEN** `BREADCRUMB_MISSING` is reported

### Requirement [ANALYSIS-019]: a title that names a past year as current is reported, in the owner's year

A page whose title, without its brand suffix, holds a four-digit year that ends the title or
follows "in", "for" or "в", and that year is earlier than the current year in the time zone of
the client's owner at the moment the page was fetched, MUST be reported as `TITLE_YEAR_OUTDATED`,
a notice, quoting the year and the current year. The current year MUST NOT be read from the
server's clock zone.

#### Scenario: last year's guide
- **WHEN** a page fetched in 2026 is titled "Best SEO tools for 2025 | Acme"
- **THEN** `TITLE_YEAR_OUTDATED` is reported with 2025 and 2026

#### Scenario: New Year's Eve in Toronto
- **WHEN** a page titled "SEO guide 2026" is fetched at 2027-01-01T04:30Z for an owner in
  America/Toronto
- **THEN** the check passes, because it is still 2026 in Toronto

#### Scenario: a year in the middle of a title
- **WHEN** the title is "2024 vs 2025: what changed in link building"
- **THEN** the check passes

### Requirement [ANALYSIS-020]: an hreflang set that leaves out its own page is reported once

A page that declares hreflang alternates, none of which is the same document as the URL it was
served at, MUST be reported as `HREFLANG_NO_SELF_REFERENCE`, a notice, and that omission MUST NOT
also be reported under `HREFLANG_INVALID`, which keeps invalid codes and a canonical naming
another URL. A finding stored under `HREFLANG_INVALID` by an earlier crawl, carrying the old
self-reference detail, MUST still render.

#### Scenario: a set without the page itself
- **WHEN** a page declares `en` and `fr` alternates naming two other URLs, both codes valid
- **THEN** `HREFLANG_NO_SELF_REFERENCE` is reported and `HREFLANG_INVALID` passes

#### Scenario: an old finding
- **WHEN** a page's stored `HREFLANG_INVALID` finding carries `selfReferenced: false`
- **THEN** its sentence renders without error

### Requirement [ANALYSIS-021]: a site whose posts need JavaScript to show their text says so, once

A crawl MUST report `CONTENT_NEEDS_JAVASCRIPT`, a site notice, when one or more of the posts it
read as HTML were skipped because their HTML holds a client-rendered shell and too little text,
with how many of how many and their URLs as evidence. Such a post MUST stay a skipped item and
MUST NOT become a page. The site check MUST read a structured flag on the fetched entry and MUST
NOT read the skip reason's text.

#### Scenario: three posts rendered by JavaScript
- **WHEN** a crawl reads 18 entries as HTML, crawls 15 and skips 3 as client-rendered
- **THEN** the site check fails with "3 of 18" and the three URLs, and none of the three is a page

#### Scenario: the reason text is reworded
- **WHEN** the skip reason's wording changes and the flag is set
- **THEN** the site check still counts the post

### Requirement [ANALYSIS-023]: a sitemap entry whose page names another canonical is a sitemap contradiction, whichever check carries it

`SITEMAP_LISTS_NON_INDEXABLE` MUST count, among the fetched sitemap entries, a page that names
another URL as its canonical, and MUST quote that canonical as the entry's reason, beside
redirects, errors, noindex, robots disallows and soft 404s. It MUST do so whichever canonical
finding carries the fact — `CANONICAL_MISMATCH`, or `CANONICAL_TO_HTTP` for the page's own
http:// twin — so that a check stepping aside for a more specific one never removes the entry
from the sitemap check.

(The id was allocated in the dropped change `canonical-change-tracking` and moves here unchanged.
ANALYSIS-022, allocated beside it to the dropped `CANONICAL_CHANGED`, is not reused.)

#### Scenario: a listed post canonicalised elsewhere
- **WHEN** a fetched sitemap entry's page carries `CANONICAL_MISMATCH` naming `https://a.example/b/`
- **THEN** the site check's evidence lists the entry with "names https://a.example/b/ as canonical"

#### Scenario: a listed post naming its http twin
- **WHEN** a fetched sitemap entry's page carries `CANONICAL_TO_HTTP` naming `http://a.example/b/`
  and no `CANONICAL_MISMATCH`
- **THEN** the site check's evidence lists the entry with "names http://a.example/b/ as canonical"

### Requirement [ANALYSIS-024]: a broken link in the text is reported, and an external one only when it is certainly gone

A page MUST be reported as `BROKEN_LINKS`, a notice, when a content link it checked is broken.
An internal link (same site key) is broken on any final 4xx or 5xx except 401, 402, 403 and 429,
which refuse the crawler rather than describe the page, on a domain that does not exist, or on
too many redirects; an internal link that redirects off the site is judged as an external one.
An external link is broken only on a final 404 or 410, or on a domain that does not exist. A
401, 403, 429, 999, 5xx, timeout, refused connection or temporary DNS failure on an external
link MUST NOT be reported, and neither MUST any answer reached through a third host on the way
(a consent or login wall). Cloudflare's `/cdn-cgi/` addresses MUST NOT be checked: they are no
pages. The external rule MUST be stated in the
code's catalogue explanation and MUST be read from one constant. A test MUST tie the two. A link
to this site's development, staging or preview host MUST be skipped, never counted as broken or
checked: it is `DEVELOPMENT_HOST_REFERENCES`'s finding, decided by the predicate that check
applies to content links.

#### Scenario: a link to the site's staging host
- **WHEN** a post links to `https://staging.a.example/draft/`, which answers 404
- **THEN** `BROKEN_LINKS` does not report it, and `DEVELOPMENT_HOST_REFERENCES` does

#### Scenario: an external page behind a bot wall
- **WHEN** a post links to an external page that answers 403
- **THEN** the link is not reported, and does not count as checked

#### Scenario: the site's own pages refuse the crawler
- **WHEN** an internal link answers 429 because of the crawl's own pace
- **THEN** the link is not reported, and does not count as checked

#### Scenario: a channel behind a consent wall
- **WHEN** an external link redirects through `consent.youtube.com` and ends on a 404
- **THEN** the link is not reported

#### Scenario: an external page removed
- **WHEN** a post links to an external page that answers 410
- **THEN** `BROKEN_LINKS` is reported quoting the link and the status

#### Scenario: someone adds 403 to the constant
- **WHEN** 403 is added to the external-broken statuses and the explanation is unchanged
- **THEN** the test tying the explanation to the constant fails

### Requirement [ANALYSIS-025]: a link to this site that redirects is reported

A page MUST be reported as `LINKS_TO_REDIRECTS`, a notice, when an internal content link it
checked redirects to a page that answers 2xx, quoting the link, the hops and the final URL. A link
already reported by `INTERNAL_LINK_VARIANTS` (plain HTTP, the other www-variant, a tracking
parameter) MUST NOT also be reported here, nor a link to this site's development host
(`DEVELOPMENT_HOST_REFERENCES`'s). An external redirect MUST NOT be reported.

#### Scenario: a moved post still linked by its old address
- **WHEN** a post links to `/old-guide/`, which answers 301 to `/guide/`
- **THEN** `LINKS_TO_REDIRECTS` is reported with the hop

#### Scenario: a plain-HTTP link on an HTTPS site
- **WHEN** a post links to `http://a.example/guide/`, which redirects to https
- **THEN** `INTERNAL_LINK_VARIANTS` reports it and `LINKS_TO_REDIRECTS` does not

### Requirement [ANALYSIS-026]: a canonical whose target redirects, errors, is noindexed or is canonicalised again is reported

A page whose first declared canonical names another URL MUST be reported as
`CANONICAL_TARGET_BROKEN`, a warning, when that target redirects, answers 4xx or 5xx, answers 200
with noindex, or answers 200 declaring a canonical to yet another URL. The target MUST be judged
from the run's own page when it is one, else from one document read under the crawl's document
budget. A target that could not be read MUST make the check not applicable, never passed.

The check MUST be not applicable when the canonical is the page's own http:// twin
(`CANONICAL_TO_HTTP`'s) or when the target is a development, staging or preview host
(`DEVELOPMENT_HOST_REFERENCES`'s).

When the check fails, `CANONICAL_MISMATCH` MUST be not applicable for that page: the broken
target is the more specific finding. Both MUST decide "the target is broken" with one shared
predicate over the same outbound facts. When the target was not read, `CANONICAL_MISMATCH` MUST
judge as it does without outbound facts.

`SITEMAP_LISTS_NON_INDEXABLE` MUST still name such a page's sitemap entry "names <url> as
canonical", reading the canonical from the `CANONICAL_TARGET_BROKEN` finding.

#### Scenario: a canonical naming a moved URL
- **WHEN** a post's canonical names `https://a.example/old/`, which answers 301
- **THEN** `CANONICAL_TARGET_BROKEN` is reported quoting the declaration and the redirect, and
  `CANONICAL_MISMATCH` is not applicable

#### Scenario: a target that was not read
- **WHEN** a post's canonical names another URL that the document budget could not reach
- **THEN** `CANONICAL_TARGET_BROKEN` is not applicable and `CANONICAL_MISMATCH` is reported, as
  without outbound checks

#### Scenario: an http-twin canonical
- **WHEN** an https post's canonical is its own http:// address, which redirects to https
- **THEN** `CANONICAL_TO_HTTP` is reported and `CANONICAL_TARGET_BROKEN` is not applicable

#### Scenario: the sitemap entry of a page whose canonical target is broken
- **WHEN** a fetched sitemap entry's page carries `CANONICAL_TARGET_BROKEN` naming
  `https://a.example/old/` and no `CANONICAL_MISMATCH`
- **THEN** `SITEMAP_LISTS_NON_INDEXABLE` lists the entry with "names https://a.example/old/ as
  canonical"

#### Scenario: a canonical chain
- **WHEN** the target answers 200 and itself declares a canonical to a third URL
- **THEN** `CANONICAL_TARGET_BROKEN` is reported as a chain, quoting both hops

#### Scenario: a target over the budget
- **WHEN** the target is outside the run and the document budget is spent
- **THEN** the check is not applicable for that page

### Requirement [ANALYSIS-027]: hreflang alternates that do not link back are reported

A page with hreflang alternates MUST be reported as `HREFLANG_NOT_RECIPROCAL`, a warning, when an
alternate other than itself and `x-default` answers 200 HTML at its own URL and declares no
hreflang alternate naming this page, quoting each such alternate. An alternate that redirected,
failed, was not 200 HTML, or was not read MUST NOT be judged, and a page none of whose alternates
could be read MUST be "not applicable".

What an older check reports MUST NOT be judged here:

- an alternate whose language or region code `HREFLANG_INVALID` reports, decided by the same
  validator, MUST be skipped;
- an alternate on a development, staging or preview host (`DEVELOPMENT_HOST_REFERENCES`'s) MUST
  be skipped;
- a page whose first declared canonical names another URL MUST be not applicable, because it
  has left its own hreflang set (`HREFLANG_INVALID`'s canonical-elsewhere arm).

#### Scenario: an alternate with a country code for a language
- **WHEN** a post names a `ua` alternate that answers 200 and does not link back
- **THEN** `HREFLANG_INVALID` reports the code and `HREFLANG_NOT_RECIPROCAL` does not judge that
  alternate

#### Scenario: a page canonicalised elsewhere
- **WHEN** a post with alternates declares another URL as its canonical
- **THEN** `HREFLANG_NOT_RECIPROCAL` is not applicable

#### Scenario: a French version without the return link
- **WHEN** an English post names `https://a.example/fr/post/`, which answers 200 and lists only
  itself and a German version
- **THEN** `HREFLANG_NOT_RECIPROCAL` is reported naming the French URL

#### Scenario: an alternate that redirects
- **WHEN** the named alternate answers 301
- **THEN** it is not judged by this check
