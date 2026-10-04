# be/src/modules/page-analysis Specification

## Purpose
What is read out of one crawled page: the SEO issues it has against the shared
catalogue, and the phrases it presents itself as being about.

## Requirements

### Requirement [ANALYSIS-001]: issues come only from the shared catalogue, and every catalogued code has a check

Every SEO issue MUST carry a code defined in `SEO_ISSUE_CATALOGUE` in `@app/contracts`, with the
severity the catalogue gives it; every catalogued code MUST have exactly one check, and a page MUST
have at most one issue per code. A check MUST carry the code it is registered under. What a check
READS and what it may RETURN are both decided by the code: a code the catalogue marks `scope: 'run'`
reads the whole crawl and answers once per page, every other code reads one page and answers once;
a code whose catalogue entry declares a bound returns a measurement — the value as found and the
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

#### Scenario: analysing every fixture page
- **WHEN** the analyser runs over every recorded and synthetic fixture page
- **THEN** every emitted code is a catalogue key

#### Scenario: a catalogue entry without a check
- **WHEN** a code is added to the catalogue and no check is registered for it
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

### Requirement [ANALYSIS-007]: a re-crawl refreshes analysis without deleting it

A re-crawl MUST replace the issues of each page it fetched AND refresh that page's two check
counters in the same act, insert new page-keyword pairs, update the relevance and
`last_seen_run_id` of surviving pairs, and MUST NOT delete any pair; analysis MUST run once per
run, after all its pages are fetched.

AMENDED during implementation (`page-health-score`, task 5.1): the requirement covered the issues
and the pairs, which was the whole of a page's analysis when it was written. A page now also
carries the counters its score is derived from, and they are part of the same verdict: refreshed
issues beside counters left at their first value would show a score that contradicts the issue
list printed next to it. "In the same act" is the requirement, not an implementation note — the
counters are columns of the same upsert, inside the same transaction as the issue rows.

#### Scenario: a keyword drops out
- **WHEN** a re-crawled page no longer yields a keyword it had
- **THEN** the pair row and its snapshots remain, with the earlier `last_seen_run_id`

#### Scenario: a re-crawl finds fewer problems
- **WHEN** a page that failed 7 of 18 checks is re-crawled and now fails 2 of 16
- **THEN** its stored counters are 16 and 2, not the earlier pair

### Requirement [ANALYSIS-011]: one pass records which checks it judged and which it could not

The analysis MUST record, for each page and in the same single pass that produces its issues, the
catalogue codes whose check reached a verdict and the codes whose check could not be judged on that
page. The two lists MUST be disjoint, MUST each hold a code at most once, and their union MUST be
exactly the catalogue that ran — the catalogued codes the catalogue had not retired at the time of
that crawl. A code whose check can answer "not applicable" MUST declare, in the shared catalogue,
the reason it can be skipped.

AMENDED during implementation (`seo-check-units`): "the catalogue that ran" now also excludes a
code retired with `enabled: false`. A retired code keeps its catalogue entry, so findings already
stored under it stay readable; it is simply not evaluated and not listed. A page crawled before the
retirement keeps the code in its stored lists and therefore in its denominator, which is why the
score is explained as what applied when the page was crawled.

#### Scenario: a page with no meta description and no images

- **WHEN** the checks are evaluated against it
- **THEN** META_DESCRIPTION_LENGTH and IMAGES_MISSING_ALT are in the not-applicable list, every
  other active catalogue code is in the judged list, and no code is in both

#### Scenario: the two lists over every recorded page

- **WHEN** the checks are evaluated against each recorded fixture post
- **THEN** the number of judged codes plus the number of not-applicable codes equals the number of
  active catalogue codes, and every not-applicable code is one the catalogue declares as
  conditional

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
