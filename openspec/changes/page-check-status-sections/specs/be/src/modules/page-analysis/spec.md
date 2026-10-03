## ADDED Requirements

### Requirement: ANALYSIS-011 — one pass records which checks it judged and which it could not

The analysis MUST record, for each page and in the same single pass that produces its issues, the
catalogue codes whose rule reached a verdict and the codes whose rule could not be judged on that
page. The two lists MUST be disjoint, MUST each hold a code at most once, and their union MUST be
exactly the catalogue that ran. A code whose rule can answer "not applicable" MUST declare, in the
shared catalogue, the reason it can be skipped.

#### Scenario: a page with no meta description and no images

- **WHEN** the rules are evaluated against it
- **THEN** META_DESCRIPTION_LENGTH and IMAGES_MISSING_ALT are in the not-applicable list, every
  other catalogue code is in the judged list, and no code is in both

#### Scenario: the two lists over every recorded page

- **WHEN** the rules are evaluated against each recorded fixture post
- **THEN** the number of judged codes plus the number of not-applicable codes equals the number of
  catalogue codes, and every not-applicable code is one the catalogue declares as conditional

#### Scenario: a rule learns to skip without a declared reason

- **WHEN** a rule is changed to answer "not applicable" for a code whose catalogue entry declares
  no skip reason
- **THEN** the test that compares the skipped set with the catalogue's conditional set fails
