# Page analysis module

Pure business opinions about a run's pages — no I/O, no clock — behind `PageAnalysisService`.

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
- **SEO rules:** one pure function per code of `SEO_ISSUE_CATALOGUE` (contracts), typed
  `{ [K in TSeoIssueCode]: TSeoRule<K> }` — a code without a rule does not compile, and the mapped
  type also decides what the rule may RETURN: a code whose catalogue entry declares a bound returns
  a measurement `{ value, min?, max? }`, every other code returns details. Thresholds live in the
  catalogue, so the rule and the screen quote one number, and the bounds are copied INTO the stored
  finding at crawl time — an old verdict explains itself against the bounds it was judged by, not
  against today's. Severity comes from the catalogue, never the rule.
- **Three outcomes, and the denominator (D3).** A rule answers `pass`, `notApplicable` or `fails`.
  The first two produce no issue and differ only in the score's denominator, which is the whole
  reason the third outcome exists: one `null` return meant either "the title is 45 characters" or
  "there is no title", and a page with no title was rewarded for passing a check that never ran.
  Thirteen of the eighteen checks always apply; five are conditional — TITLE_LENGTH and
  META_DESCRIPTION_LENGTH on the field existing, CANONICAL_MISMATCH on there being a canonical to
  disagree with, IMAGES_MISSING_ALT on there being an image, HEADING_SKIP on there being two or
  more headings. So `13 <= checks_applicable <= 18`, which `seo-rules.registry.spec.ts` asserts
  over every recorded fixture post, and which is why a page's score can never rest on a denominator
  too small to mean anything. Applicability is counted HERE, at crawl time, because the stored
  `pages` row holds no canonical, no Open Graph and no JSON-LD and cannot answer it later.
- **The pass records WHICH checks ran, not only how many.** `evaluateSeoRules` returns two
  disjoint lists in catalogue order — `checksJudged` and `checksNotApplicable` — and their union
  is the catalogue AS OF THAT CRAWL. That union is the only record of it there will ever be:
  read back against a catalogue that has since grown, a code in neither list is one that did not
  exist when the page was seen, and a count alone cannot say which. No constraint can state the
  union property, because any spelling of it names the catalogue's size and would break every
  older row the day a check is added; `seo-rules.registry.spec.ts` asserts it over the recorded
  corpus instead. What the database CAN state, and does, is
  `checks_applicable = cardinality(checks_judged)`.
<!-- invariant: ANALYSIS-011 -->
**One pass records which checks it judged and which it could not.** The two lists are disjoint,
in catalogue order, and their union is the catalogue as of that crawl. Pinned by
`be/src/modules/page-analysis/services/seo-rules/seo-rules.registry.spec.ts` ->
"the five conditional checks drop out together" and "emits only catalogued codes over every
recorded page", which assert disjointness and the union over the recorded corpus. The counter
half is pinned by the database instead: CHECK `pages_checks_judged_matches_applicable`.
Specified in `openspec/specs/be/src/modules/page-analysis/spec.md`.

- **A skippable check declares why, in the catalogue.** The reason is a property of the rule and
  not of a page — `IMAGES_MISSING_ALT` is skipped for one reason every time — so it is
  `skipReason` beside `label` and `hint`, and `CONDITIONAL_ISSUE_CODES` is derived from its
  presence rather than repeated as a second list. The registry spec asserts the skipped set over
  the corpus is exactly those codes, which is what fails when a rule learns to skip and the
  catalogue is not told why.
- **Two checks are deliberately absent.** `SLOW_RESPONSE` measured the crawler's network position
  rather than the page, and `KEYWORD_NOT_IN_TITLE` could not fail by construction. The
  measurements are in `practices/search-engines/references/field-study-2026-10.md`, findings 3 and
  4; they are not repeated here. Any future rule built on a single server-side timing is the same
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
**Issues come only from the shared catalogue: one rule per code, one issue per code on a page, and the code decides the rule’s return shape.** Pinned by `services/seo-rules/seo-rules.registry.spec.ts` -> "has exactly one rule per catalogued code" and "emits only catalogued codes over every recorded page"; the unique index `seo_issues_page_id_code_uq`. The return-shape half is `pnpm typecheck` over the mapped type, not a test.

<!-- invariant: ANALYSIS-002 -->
**The eighteen checks, their thresholds and their severities, each finding saying exactly what is wrong.** Pinned by the per-rule specs under `services/seo-rules/rules/` (title, meta, heading, content, indexing, transport, structured-data) and `seo-rules.registry.spec.ts` -> "reports catalogue severity and order".

<!-- invariant: ANALYSIS-003 -->
**The page title is `head > title` only; a `<title>` inside an SVG in the body is not the page title.** Pinned by `services/html-extraction/extract-page.spec.ts` -> "reads the title from <head>, never from an SVG in the body (semrush)".

<!-- invariant: ANALYSIS-004 -->
**Keyword candidates are normalized main-content phrases that never begin or end with a stop word.** Pinned by `services/keyword-extraction/collect-candidates/collect-candidates.spec.ts` -> "never starts or ends a candidate with a stop word" and "without a known language, stops at 2-grams and filters nothing"; `tokenize/tokenize.spec.ts` -> "normalizes and splits on sentence breaks".

<!-- invariant: ANALYSIS-005 -->
**Candidates are scored by field weight with subsumed duplicates removed, and the page keeps at most eight above the floor — never topped up to a minimum.** Pinned by `score-candidates/score-candidates.spec.ts` -> `describe("pageScore")`; `select-keywords/select-keywords.spec.ts` -> "keeps at most 8 above the floor, the top at relevance 1"; `extract-keywords/extract-keywords.spec.ts` -> "gives every page 1–8 keywords, the top at relevance 1".

<!-- invariant: ANALYSIS-006 -->
**Scores are damped by an IDF factor over the run’s pages, so a term on every page of a site fades.** Pinned by `score-candidates/score-candidates.spec.ts` -> `describe("idfFactor")` -> "is below 0.3 for a term on every page of 15, and 1 for a term on one of them"; `extract-keywords.spec.ts` -> "never returns the brand word at all".

<!-- invariant: ANALYSIS-008 -->
**A bounded code’s finding is a measurement carrying the bounds that were in force when the page was crawled, not today’s.** Pinned by `packages/contracts/src/domain/seo/measured-issue-codes.test.ts` -> "holds every catalogue entry that declares a min or a max"; `rules/title-rules/title-rules.spec.ts` -> the "TITLE_LENGTH at %d characters" cases; `be/test/e2e/pages.e2e-spec.ts` -> "the detail carries its score, the fetch time and a measured finding".

<!-- invariant: ANALYSIS-009 -->
**The extractor reads headings and blocks as a reader sees them: assistive-only text and in-heading controls contribute nothing.** Pinned by `services/html-extraction/extract-page.spec.ts` -> "a copy-link control inside an h2 is not part of the heading (vercel.com)", "an element hidden from assistive technology contributes no text", "separates adjacent blocks so their words never fuse".

<!-- invariant: ANALYSIS-010 -->
**Every rule answers pass, not applicable, or a finding, and the page stores both check counts.** Pinned by `seo-rules.registry.spec.ts` -> "a clean page has no issues, and every check applied to it", "a check that could not be judged is not counted against the page", "checksFailed is always the number of issues"; the CHECKs `pages_checks_failed_range` and `pages_checks_applicable_positive`.
