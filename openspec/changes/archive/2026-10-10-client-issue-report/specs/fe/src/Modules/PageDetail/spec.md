## MODIFIED Requirements

### Requirement: PAGEDETAIL-005 — issues are grouped by severity in plain words, and an unreachable page is not found

SEO issues MUST be grouped Critical / Important / Improvement, each as the catalogue's sentence with
its details; where the code has a bound, the sentence MUST be rendered from the measurement STORED on
the finding, never from the catalogue's current bounds. A page id that is foreign or missing MUST
show a not-found view with a link to Pages.

AMENDED during implementation (`seo-check-catalogue-correction`, task 5.2): the requirement said
"with its details" and left open where the numbers in a sentence come from. Reading them from the
catalogue at render time would make an old verdict explain itself against bounds it was never
judged against — "the title is 72 characters; aim for 30–65" over a crawl that failed it at 60.
The finding carries its own bounds, and the sentence reads those.

Modified by `client-issue-report`: the group names follow the product's one severity vocabulary
(SHELL-004), so the page and the issue report name a level the same way.

#### Scenario: another user's page id
- **WHEN** user B opens `/pages/<A's page id>`
- **THEN** the not-found view is shown and no data of the page appears

#### Scenario: a threshold moved after the crawl
- **WHEN** a finding stored `{ value: 72, min: 30, max: 60 }` and the catalogue now says 30–65
- **THEN** the sentence still reads "The title is 72 characters; aim for 30–60."

#### Scenario: the group names
- **WHEN** a page carries an error, a warning and a notice
- **THEN** its groups read Critical, Important and Improvement, in that order
