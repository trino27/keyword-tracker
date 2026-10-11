## ADDED Requirements

### Requirement: ANALYSIS-022 — a canonical that changed since the client's previous crawl is reported once

A page whose previous crawl recorded its canonical MUST be reported as `CANONICAL_CHANGED`, a
notice, when the canonical it declares now is a different document from the recorded one —
including a canonical that appeared or disappeared — quoting both and the day of the previous
crawl. A page with no previous crawl, or whose previous crawl did not record its canonical, MUST
NOT be judged by this check. A trailing-slash or fragment difference MUST NOT count as a change.

#### Scenario: a plugin rewrites the canonical
- **WHEN** a page recorded `https://a.example/post/` on Oct 12 and now declares
  `https://a.example/category/post/`
- **THEN** `CANONICAL_CHANGED` is reported quoting both and Oct 12

#### Scenario: the first crawl after the migration
- **WHEN** a page's previous row predates canonical recording
- **THEN** the check is not applicable

#### Scenario: the crawl after the change
- **WHEN** the page is crawled again and declares the same new canonical
- **THEN** the check passes

### Requirement: ANALYSIS-023 — a sitemap entry whose page names another canonical is a sitemap contradiction

`SITEMAP_LISTS_NON_INDEXABLE` MUST count, among the fetched sitemap entries, a page that names
another URL as its canonical, and MUST quote that canonical as the entry's reason, beside
redirects, errors, noindex, robots disallows and soft 404s.

#### Scenario: a listed post canonicalised elsewhere
- **WHEN** a fetched sitemap entry's page carries `CANONICAL_MISMATCH` naming `https://a.example/b/`
- **THEN** the site check's evidence lists the entry with "names https://a.example/b/ as canonical"

## MODIFIED Requirements

### Requirement: ANALYSIS-010 — a rule answers pass, not applicable, or a finding, and the page stores both counts

Every rule MUST return one of three outcomes — the check passed, the check could not be judged on
this page, or the check failed with its finding — and the analysis MUST store, on the page and in
the same act that stores its issues, how many checks could be judged and how many of those
failed. Applicability MUST be decided while the parsed page is in hand, because the stored page
row holds no Open Graph and no JSON-LD, and of the canonical only the one the page declared, and
cannot answer the question later.

Modified by `canonical-change-tracking`: the row now stores the declared canonical (PAGES-015),
so the reason given here no longer said what the row holds. The requirement itself is unchanged.

#### Scenario: a page with no meta description

- **WHEN** a page declares no meta description
- **THEN** META_DESCRIPTION_MISSING fails, META_DESCRIPTION_LENGTH is not applicable, and the page's applicable count excludes it

#### Scenario: the counts agree with the issue rows

- **WHEN** a crawl stores a page with three issues
- **THEN** its stored failed count is 3, and its applicable count is between 13 and 18

#### Scenario: an impossible pair of counts

- **WHEN** a write attempts a failed count greater than the applicable count
- **THEN** the database rejects it and the run's finalize aborts rather than storing an impossible score
