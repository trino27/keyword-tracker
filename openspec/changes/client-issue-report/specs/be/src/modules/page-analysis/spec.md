## ADDED Requirements

### Requirement: ANALYSIS-013 — every finding explains itself to a marketer in three plain parts

Every entry of the page catalogue and of the site catalogue MUST carry, beside its curated label,
hint, explanation and sources, a plain `what` (the problem in one sentence), `why` (its cost in
visibility, traffic or clicks) and `fix` (what to do, naming who does it — an editor in the CMS, an
SEO plugin, a developer, the host). None of the three MAY contain markup characters, and each MUST
stay within its declared length bounds. The curated fields MUST NOT be rewritten to serve as plain
copy.

#### Scenario: an entry added without plain copy
- **WHEN** a catalogue entry is added with no `plain`
- **THEN** `pnpm typecheck` fails

#### Scenario: a fix that names nobody
- **WHEN** an entry's `fix` names no one who would act
- **THEN** the plain-copy test fails

#### Scenario: a fix that quotes a tag
- **WHEN** an entry's `fix` says "add a <title> tag"
- **THEN** the plain-copy test fails on the markup character
