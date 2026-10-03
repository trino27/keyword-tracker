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
  `Record<TSeoIssueCode, TSeoRule>` — a code without a rule does not compile. Thresholds live in
  the catalogue, so the rule and the screen quote one number. Severity comes from the catalogue,
  never the rule.
- **Tunables** are constants in `constants/keyword-scoring.constant.ts`; the golden test on the
  recorded yoast posts pins their combined effect (a slug phrase in the top 3 of ≥ 12 of 15 pages,
  "yoast" in no top 3).
