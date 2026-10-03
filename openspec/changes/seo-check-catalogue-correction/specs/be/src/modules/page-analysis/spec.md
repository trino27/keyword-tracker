## ADDED Requirements

### Requirement: ANALYSIS-008 — a threshold finding carries the value and the bounds it was judged against

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

### Requirement: ANALYSIS-009 — the extractor reads heading text as a reader sees it

Text that exists only for assistive technology, and controls placed inside a heading, MUST NOT
become part of a heading, a content block or a keyword candidate; adjacent elements MUST be
separated before any text is read, so two neighbouring strings never fuse into one word.

#### Scenario: a copy-link control inside a heading

- **WHEN** a page's `<h2>` contains a control labelled "Copy link to heading" before the text "Agentic infrastructure"
- **THEN** the extracted heading is exactly "Agentic infrastructure" and no keyword begins with "heading"

#### Scenario: an element hidden from assistive technology

- **WHEN** a `<span aria-hidden="true">` sits inside a paragraph of the main content
- **THEN** its text contributes neither to the block nor to the word count
