## ADDED Requirements

### Requirement: ANALYSIS-028 — every Lighthouse SEO and accessibility audit that can return a verdict is a catalogue code

The catalogue MUST hold one code owned by Lighthouse for each audit of Lighthouse's SEO and
accessibility categories that can return a verdict. Audits Lighthouse marks `manual` or
`informative` MUST NOT be catalogued. Each code MUST declare:
- the audit id it reads;
- the category it belongs to;
- the audit's weight in that category.

A code's severity MUST follow from its weight: 7 or more is a warning, anything less is a notice.
The one exception is `is-crawlable`, which is an error, and the exception MUST be declared where
the rule is. Every Lighthouse code MUST carry the same plain copy, hint, explanation and sources
as any other catalogue code. Its copy MUST be written from what the audit checks in a recorded
live answer, never from the audit's name alone.

#### Scenario: an audit weighted 10 in accessibility
- **WHEN** the catalogue entry for an accessibility audit of weight 10 is read
- **THEN** its severity is warning

#### Scenario: the page is blocked from indexing
- **WHEN** the catalogue entry for `is-crawlable` is read
- **THEN** its severity is error

#### Scenario: a catalogued audit and the recorded answer disagree on weight
- **WHEN** a Lighthouse code declares a weight other than the weight its audit carries in the
  recorded live answer
- **THEN** the catalogue test fails

#### Scenario: a manual audit
- **WHEN** the recorded answer marks `structured-data` as `manual`
- **THEN** no Lighthouse code reads it

### Requirement: ANALYSIS-029 — codes of different owners that check the same thing are declared as one group

The groups of codes, across owners, that check the same property of a page MUST be declared once,
in `@app/contracts`. A code MUST belong to at most one group, and a group MUST hold codes of at
least two owners. A group MUST only decide which verdicts are shown side by side. It MUST NOT
merge, suppress or re-weight a finding. Each owner keeps its own findings, its own severities and
its own share of the score. A check MUST still not repeat a finding of an older check of the
SAME owner. Between owners, a repeated finding is expected and is counted on both sides.

#### Scenario: the canonical group
- **WHEN** the groups are read
- **THEN** one group holds `CANONICAL_MISSING`, `CANONICAL_MISMATCH`, `CANONICAL_CONFLICT`,
  `CANONICAL_RELATIVE`, `CANONICAL_TO_HTTP` and Lighthouse's `canonical` code

#### Scenario: a code put in two groups
- **WHEN** a code is added to a second group
- **THEN** the groups test fails

#### Scenario: a page without a title
- **WHEN** a page has no title and Lighthouse fails `document-title`
- **THEN** the page holds both `TITLE_MISSING` and Lighthouse's title code as findings

## MODIFIED Requirements

### Requirement: ANALYSIS-012 — every catalogue code names the one process that writes it

The catalogue MUST be a registry of owners: the crawl, the PageSpeed worker's Core Web Vitals and
Lighthouse. Each owner MUST have its own catalogue, and an entry's owner MUST be the registry key
it sits under, not a field written beside it. The set of owners, the set of codes each owner
writes and the type of each owner's codes MUST all be derived from the registry. None of them may
be listed a second time or defined as "every code but another owner's". The owners' code sets
MUST be disjoint and together MUST be the whole catalogue. Each owner MUST declare whether its
verdicts count in the page's score. A writer MUST replace only the findings under codes it owns.

Modified by `lighthouse-checks`: a third owner arrives. The crawl's codes used to be defined as
every code the PageSpeed worker does not own, so each new owner's codes would have become crawl
codes, and the compiler would have demanded a crawl check for every Lighthouse audit. The owner
moves from a field into the registry's key so that an entry cannot claim one owner while living
in another's catalogue.

#### Scenario: an owner added without a catalogue

- **WHEN** a fourth owner is added to the registry's type without a catalogue
- **THEN** `pnpm typecheck` fails

#### Scenario: the partition

- **WHEN** each owner's codes are listed from the registry
- **THEN** no code is in two owners' sets and every catalogue code is in one

#### Scenario: the same code in two owners' catalogues

- **WHEN** a code is defined in the crawl's catalogue and in Lighthouse's
- **THEN** the disjointness type-test fails

#### Scenario: Lighthouse codes are not crawl codes

- **WHEN** the crawl's code type is read
- **THEN** it holds no Lighthouse code, and the check registry compiles without a check for any
  Lighthouse code

#### Scenario: who is scored

- **WHEN** the registry is read
- **THEN** the crawl and Lighthouse are scored owners, and the PageSpeed worker's Core Web Vitals
  are not

#### Scenario: the Core Web Vitals codes

- **WHEN** the catalogue is read
- **THEN** `CWV_LCP_POOR`, `CWV_INP_POOR` and `CWV_CLS_POOR` are owned by the PageSpeed worker
  with severity warning, the three `…_NEEDS_IMPROVEMENT` codes are owned by it with severity
  notice, and each declares as its `max` the threshold of `CWV_THRESHOLDS` its band begins above
