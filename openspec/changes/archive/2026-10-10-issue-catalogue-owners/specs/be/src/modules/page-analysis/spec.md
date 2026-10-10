## ADDED Requirements

### Requirement: ANALYSIS-012 — every catalogue code names the one process that writes it

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

## MODIFIED Requirements

### Requirement: ANALYSIS-001 — issues come only from the shared catalogue, and every crawl-owned code has a check

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

### Requirement: ANALYSIS-007 — a re-crawl refreshes its own analysis without deleting another writer's

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

### Requirement: ANALYSIS-011 — one pass records which checks it judged and which it could not

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
