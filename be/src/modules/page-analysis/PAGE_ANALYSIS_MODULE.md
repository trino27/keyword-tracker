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
