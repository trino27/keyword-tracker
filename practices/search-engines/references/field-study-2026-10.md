# Field study — this repository's analysis run against live pages, 2026-10-03

Measurements, not advice. Every other reference in this skill cites this one when it says "in
practice".

## Method

A throwaway script fetched real pages and ran **this repository's own code** on them —
`extractPage`, `extractKeywords` and `evaluateSeoRules`, unmodified — so the numbers below are
what the product would have reported, not an approximation of it.

For each site: read `robots.txt`, follow the first declared `Sitemap:` (or guess
`/sitemap.xml`), walk one level of sitemap index, pick article URLs spread across the sitemap
rather than adjacent ones, fetch each once with a 400 ms pause, and analyse the set as one crawl
run so the IDF step has its corpus.

The script lived in the scratchpad and was deleted. It is cheap to rebuild from this description.

## Limits — read before quoting any number

- **Fifteen pages, three sites.** Not a sample anyone should generalise from; enough to show that
  a rule fires on competent pages, which is all it is used for here.
- **All three are technology publishers with strong engineering.** They are *not* representative
  of a marketing agency's clients. If anything they are the optimistic end.
- **One fetch per page, from one machine, in one place, on one day.** Timing numbers are
  anecdotes. They are reported because the catalogue has a timing rule, not because they measure
  the sites.
- **No rendering.** Server HTML only, as the crawler does.

## The pages

`T` = title length, `M` = meta description length, `W` = word count, `TTFB` ms, `KB` = HTML size.

| Page | T | M | h1 | W | JSON-LD | TTFB | KB | Issues |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| moz / wtf-is-nl-web | 39 | 156 | 2 | 1874 | Article+Org+Breadcrumb | 41 | 114 | 3 |
| moz / mozcon-london-2025 | 63 | 149 | 2 | 2180 | Article+Org+Breadcrumb | 1667 | 134 | 5 |
| moz / keyword-research-methods | 63 | 174 | 2 | 2398 | Article+Org+Breadcrumb | 1349 | 118 | 4 |
| moz / drive-sales-digital-pr | 72 | 218 | 2 | 2303 | Article+Org+Breadcrumb | 1728 | 116 | 5 |
| moz / adapt-b2b-seo-strategy | 46 | 70 | 2 | 2284 | Article+Org+Breadcrumb | 1503 | 108 | 3 |
| vercel / v0-snowflake-oauth | 82 | 196 | 1 | 1476 | none | 220 | 646 | 2 |
| vercel / nuxtlabs-joins-vercel | 30 | 151 | 1 | 402 | none | 249 | 493 | **0** |
| vercel / self-driving-infrastructure | 36 | 228 | 1 | 911 | none | 229 | 590 | 1 |
| vercel / vercel-acquires-grep | 55 | 101 | 1 | 227 | none | 373 | 499 | 1 |
| vercel / ai-sdk-4-2 | 19 | 117 | 1 | 2307 | none | 272 | 1122 | 2 |
| cloudflare / k2-streams | 68 | 306 | 1 | 1516 | BlogPosting | 234 | 296 | 2 |
| cloudflare / introducing-radar | 46 | 254 | 1 | 1302 | BlogPosting | 254 | 304 | 1 |
| cloudflare / post-quantum-to-origins | 93 | 118 | 1 | 3092 | BlogPosting | 628 | 327 | 1 |
| cloudflare / tanium-teams | 71 | 89 | 1 | 1041 | BlogPosting | 903 | 284 | 1 |
| cloudflare / do-the-chacha | 76 | 200 | 1 | 1707 | BlogPosting | 709 | 292 | 2 |

## How often each rule fired

Out of fifteen pages.

| Code | Fired | Note |
| --- | --- | --- |
| `TITLE_LENGTH` | **9** | measured 19–93 against a 30–60 window |
| `META_DESCRIPTION_LENGTH` | **7** | measured 70–306 against a 70–160 window |
| `H1_MULTIPLE` | 5 | every Moz page; a template property, not a page property |
| `HEADING_SKIP` | 5 | every Moz page; same |
| `SLOW_RESPONSE` | 3 | all Moz; same site also produced the fastest fetch in the study (41 ms) |
| `IMAGES_MISSING_ALT` | 2 | 2 and 4 images respectively |
| `THIN_CONTENT` | 1 | a 227-word acquisition announcement |
| `LARGE_PAGE` | 1 | 1122 KB; Vercel's pages run 493–1122 KB |
| `TITLE_MISSING`, `META_DESCRIPTION_MISSING`, `H1_MISSING`, `CANONICAL_MISSING`, `CANONICAL_MISMATCH`, `NOINDEX`, `LANG_MISSING`, `OG_TAGS_MISSING`, `NOT_HTTPS`, `REDIRECTED` | 0 | expected: these describe broken pages, and none of these pages is broken |
| `KEYWORD_NOT_IN_TITLE` | 0 | see finding 4 — it can barely fire by construction |

## Findings

**1. The two length rules dominate the output.** Sixteen of the thirty-one issues raised were
title or description length. On a set of professionally produced pages from publishers who sell
SEO advice, this is a rule reporting a stylistic disagreement, not a defect. One of the sites is
Moz.

**2. Some issues are site-wide, not page-wide.** `H1_MULTIPLE` and `HEADING_SKIP` fired on five
of five Moz pages — one template emitting two `h1`s and an irregular outline. Reported per page
it looks like five problems; it is one, in a layout file. A list of pages each carrying the same
two rows is a presentation the data does not support.

**3. Timing from a crawler is not a page property.** The same site produced 41 ms and 1728 ms on
different fetches minutes apart. Cross-reference `ranking-signals.md`: Core Web Vitals are field
metrics at the 75th percentile, which a single server-side fetch cannot approximate.

**4. `KEYWORD_NOT_IN_TITLE` is near-tautological.** Title presence contributes the largest field
weight to a candidate's score, so the top keyword is almost always drawn from the title. It fired
zero times, and inspection of the scoring explains why that is structural rather than lucky.

**5. The declared-keyword bonus did not apply here — and this is where the sample misled.** No
page in the sample emitted JSON-LD `keywords` or `article:tag`, so the 1.15 multiplier never
applied, and the first reading of that was "the bonus is inert". Checking the repository's own
golden fixtures refuted it: **20 of the 23 recorded Yoast posts carry a non-empty JSON-LD
`keywords` array** (`be/test/fixtures/sites/yoast/`). The bonus is alive and exercised by the
test suite.

What the sample actually shows is narrower and more useful: modern technology blogs built on
bespoke stacks declare no keywords, while WordPress-with-Yoast sites do. The second group is
what a marketing agency's clients mostly are. This is the limits section biting in a specific
place — treat any "X never happens" conclusion from these three sites as a statement about
those three sites.

**6. Keyword selection spends slots on one idea.** `post quantum`, `post quantum cryptography`
and `uses post quantum` all survived into one page's six keywords.

**7. A real extraction defect, found only because real HTML was used.** Vercel places a
copy-link control inside each `<h2>`, labelled "Copy link to heading". The extractor joins
adjacent text nodes without a separator and filters no accessibility-only labels, so the heading
text became `Copy link to headingAgentic infrastructure` and the keywords
`headingagentic infrastructure` and `headingthe future` were returned for that page. Two causes,
both fixable, neither visible in a fixture test written from clean HTML.

**8. Structured data varies enough to be worth knowing.** Moz emits
`Article` + `Organization` + `BreadcrumbList`, Cloudflare `BlogPosting`, Vercel nothing at all.
The extractor already reads these; no rule consults them.

## Checks the catalogue does not have, measured anyway

| Candidate check | What the sample showed |
| --- | --- |
| `viewport` missing | present on **15 of 15** — a rule here would almost never fire |
| `hreflang` | only Cloudflare (2–6 links); absent elsewhere |
| link text quality | 168–1002 anchors per page; 2–25 with empty text; 0–2 generic ("read more") |

The link-text numbers are the cautionary one. Cloudflare's pages carry about a thousand anchors,
of which roughly twenty have no text — these are icon links whose accessible name comes from
`aria-label` or an image's alt. A naive "links without descriptive text" rule, of the kind
Lighthouse runs, would fire on effectively every page in the sample. Any implementation has to
consult `aria-label`, `title` and nested image alt text, and probably has to scope itself to the
main content rather than the chrome.

## Crawl-level observations

- **`ahrefs.com` yielded nothing.** `robots.txt` existed but declared no `Sitemap:`, and
  `/sitemap.xml` did not lead to blog articles by the obvious path. The site was dropped from the
  study. Sitemap discovery is not a solved problem in the wild.
- **`app.asana.com` answered 403** — bot protection — and that 403 page still parsed into a
  title and an `h1`. A 200-only check is load-bearing.
- **`notion.com/blog` has no `h1`** in server HTML and 313 words: a real marketing blog index
  that would be reported as `H1_MISSING`, correctly or not depending on what the page is for.
- **`react.dev/learn` carried 1750 words in server HTML.** Static generation means a
  "JavaScript-heavy" site is often fully visible to a non-rendering crawler. The absence of
  rendering cost nothing on any page sampled here.

## Reproducing this

Rebuild the script from the method section, point it at a different set of sites, and compare.
The most valuable variation would be **a set of actual agency-client blogs** — small business
sites on WordPress and similar — where the error-level rules that fired zero times here are
likely to fire, and where the thresholds would be tested against the population the product
exists for.
