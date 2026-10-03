# Page analysis module

Pure business opinions about a run's pages — no I/O, no clock — behind `PageAnalysisService`.

- **Keywords (D15).** Candidates are 1–3-grams that never start or end with a stop word (the
  page's declared language; no language → 2-grams, no filtering) and never cross a sentence or
  heading. Score = presence in title 5, H1 4, URL slug 3, description 2, H2/H3 2, first paragraph
  1.5, plus ln(1 + body frequency); × 1.25 per extra deliberate field; × 1.15 if the page declares
  it (JSON-LD `keywords`, `article:tag`); a slight preference for phrases; × an IDF factor over the
  run's pages, so a term on every page (the brand) fades. A word gives way to a phrase containing
  it that scores ≥ 0.8 of it. 5–8 kept, relevance = score / top.
  Rejected: TF-IDF alone (ignores where a phrase sits), YAKE/RAKE (no field weights), an LLM or a
  SERP API (cost, non-determinism, keys).
- **Title brand suffix** ("… • Yoast", "… | Semrush Blog") is cut when its last segment names the
  site (first label of the site key, or `og:site_name`).
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
  "yoast" in no top 3).
