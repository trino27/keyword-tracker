## ADDED Requirements

### Requirement: ANALYSIS-001 — issues come only from the shared catalogue, and every catalogued code has a rule

Every SEO issue MUST carry a code defined in `SEO_ISSUE_CATALOGUE` in `@app/contracts`, with the
severity the catalogue gives it; every catalogued code MUST have exactly one rule, and a page MUST
have at most one issue per code.

#### Scenario: analysing every fixture page
- **WHEN** the analyser runs over every recorded and synthetic fixture page
- **THEN** every emitted code is a catalogue key

#### Scenario: a catalogue entry without a rule
- **WHEN** a code is added to the catalogue and no rule is registered for it
- **THEN** `pnpm typecheck` fails

### Requirement: ANALYSIS-002 — the SEO rules and their thresholds

The analyser MUST report: TITLE_MISSING (error); TITLE_LENGTH below 30 or above 60 characters
(warning); META_DESCRIPTION_MISSING (warning); META_DESCRIPTION_LENGTH below 70 or above 160
(notice); H1_MISSING (error); H1_MULTIPLE (warning); HEADING_SKIP (notice); CANONICAL_MISSING
(warning); CANONICAL_MISMATCH (notice); NOINDEX by meta robots or `X-Robots-Tag` (error);
IMAGES_MISSING_ALT (warning); THIN_CONTENT below 300 words (warning); LANG_MISSING (notice);
OG_TAGS_MISSING (notice); NOT_HTTPS (error); REDIRECTED (notice); SLOW_RESPONSE above 1.5 s to the
first byte (notice); LARGE_PAGE above 1 MB of HTML (notice); KEYWORD_NOT_IN_TITLE (notice, after
keywords). Each issue's details MUST say what exactly is wrong.

#### Scenario: a 61-character title
- **WHEN** a page's title is 61 characters
- **THEN** TITLE_LENGTH is reported as a warning with details `{ length: 61, min: 30, max: 60 }`

#### Scenario: a decorative image
- **WHEN** an image in the main content has `alt=""`
- **THEN** it does not count towards IMAGES_MISSING_ALT

### Requirement: ANALYSIS-003 — the page title is the document's head title

The title used for rules and keywords MUST be read from `<head><title>` only; a `<title>` inside
inline SVG in the body MUST be ignored.

#### Scenario: Semrush's SVG title
- **WHEN** a Semrush post with an SVG `<title>` in its body is analysed
- **THEN** the page title is the head title

### Requirement: ANALYSIS-004 — keyword candidates are clean on-page phrases

Keyword candidates MUST be 1–3-word phrases from the page's main content and fields (navigation,
header, footer, aside and scripts removed), normalized (NFKC, lower case, punctuation stripped,
whitespace collapsed), never starting or ending with a stop word of the page's language; with an
unknown language no stop words apply and phrases are at most 2 words.

#### Scenario: a phrase ending with "the"
- **WHEN** a heading reads "Optimize the"
- **THEN** "optimize the" is not a candidate

### Requirement: ANALYSIS-005 — each page keeps its 5 to 8 most relevant phrases

Candidates MUST be scored by field weight (title 5 with the brand suffix removed, h1 4, URL slug 3,
meta description 2, h2/h3 2, first paragraph 1.5, body 1), a bonus for presence in several strong
fields, a small bonus for declared metadata (JSON-LD keywords, `article:tag`), with subsumed
duplicates removed; at most 8 above the floor are kept (at least 5 when available), with relevance
in (0, 1] where the top keyword is 1.

#### Scenario: a typical post
- **WHEN** a recorded Yoast post is analysed in its run
- **THEN** it has between 5 and 8 keywords, the first with relevance 1, and its slug phrase among the top 3

### Requirement: ANALYSIS-006 — site-wide terms fade

Scores MUST be multiplied by an IDF factor over the run's pages, `ln(1 + N/df) / ln(1 + N)`, so a
term present on every page of the run ranks below page-specific terms; with one page the factor is 1.

#### Scenario: the brand on every page
- **WHEN** "yoast" appears on all 15 pages of a run
- **THEN** it is not in any page's top 3 keywords

### Requirement: ANALYSIS-007 — a re-crawl refreshes analysis without deleting it

A re-crawl MUST replace the issues of each page it fetched, insert new page-keyword pairs, update
the relevance and `last_seen_run_id` of surviving pairs, and MUST NOT delete any pair; analysis
MUST run once per run, after all its pages are fetched.

#### Scenario: a keyword drops out
- **WHEN** a re-crawled page no longer yields a keyword it had
- **THEN** the pair row and its snapshots remain, with the earlier `last_seen_run_id`
