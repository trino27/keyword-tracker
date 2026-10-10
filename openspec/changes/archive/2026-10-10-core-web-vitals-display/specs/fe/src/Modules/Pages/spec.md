## ADDED Requirements

### Requirement: PAGELIST-008 — each row shows its three Core Web Vitals as traffic lights beside the score

The list MUST show, in a column right of Score, three badges LCP · INP · CLS coloured by band —
good green, needs improvement yellow, poor red, no data grey — each with a tooltip giving the
value, the source in plain words (this page's real visitors, the whole site's real visitors, or a
lab test that may vary) and the date measured. A row MUST read "Measuring…" while its page is
queued or running with nothing measured, MUST show its last badges with a warning marker and the
plain reason when the latest attempt failed after an earlier success, MUST read "Couldn't measure:
<reason>" when nothing was ever measured, and "Not measured" when the page has no queue row. When
PageSpeed's state is `notConfigured` the column header MUST say so and the cells MUST NOT show grey
badges. When it is `keyRejected` the column header MUST say "PageSpeed key rejected" with a tooltip
saying measurements are paused and pointing at the README, stored badges MUST stay visible, and a
row that would read "Measuring…" MUST read "Paused".
A legend MUST say that red is Important and yellow is Improvement in Issues, and that speed is
scored separately. The Score column, its values and the row order MUST NOT change.

#### Scenario: a page with a slow LCP
- **WHEN** a row's LCP is 3100 ms from this page's real visitors, measured Oct 9
- **THEN** its LCP badge is yellow and its tooltip reads "LCP 3.1 s — needs improvement. Real
  visitors to this page, measured Oct 9."

#### Scenario: no INP data
- **WHEN** a measurement has no INP
- **THEN** the INP badge is grey and its tooltip says Google has no real-visitor INP for the page
  or the site

#### Scenario: PageSpeed not configured
- **WHEN** the list says `state: 'notConfigured'`
- **THEN** the column header reads "PageSpeed not configured" and every cell shows a dash

#### Scenario: Google rejected the key
- **WHEN** the list says `state: 'keyRejected'`, one row has a measurement and another is queued
- **THEN** the header reads "PageSpeed key rejected", the first row keeps its badges, and the
  second reads "Paused"
