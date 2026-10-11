## ADDED Requirements

### Requirement: ANALYSIS-014 — an industry-only check is at most a notice

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

### Requirement: ANALYSIS-015 — a canonical naming the page's own http:// twin is reported once, as that

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

### Requirement: ANALYSIS-016 — og:url that names another URL than the page's canonical is reported

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

### Requirement: ANALYSIS-017 — a meta description that only repeats the title is reported

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

### Requirement: ANALYSIS-018 — a post with no breadcrumb markup is reported

A page whose JSON-LD and Microdata declare no `BreadcrumbList`, including a `BreadcrumbList`
inside an `@graph`, MUST be reported as `BREADCRUMB_MISSING`, a notice. A page that declares one,
however incomplete, MUST pass this check; an incomplete one is `BREADCRUMB_INVALID`'s.

#### Scenario: Yoast's graph
- **WHEN** a post's JSON-LD `@graph` holds a `BreadcrumbList`
- **THEN** the check passes

#### Scenario: no breadcrumb anywhere
- **WHEN** a post declares an `Article` and nothing else
- **THEN** `BREADCRUMB_MISSING` is reported

### Requirement: ANALYSIS-019 — a title that names a past year as current is reported, in the owner's year

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

### Requirement: ANALYSIS-020 — an hreflang set that leaves out its own page is reported once

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

### Requirement: ANALYSIS-021 — a site whose posts need JavaScript to show their text says so, once

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

### Requirement: ANALYSIS-023 — a sitemap entry whose page names another canonical is a sitemap contradiction, whichever check carries it

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
