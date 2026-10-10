## ADDED Requirements

### Requirement: PAGEDETAIL-011 — the page shows its Core Web Vitals with their source and age

The detail MUST show a "Speed (Core Web Vitals, mobile)" block with one card per metric — the
value with its unit, the band in words and colour, the source in plain words and the date
measured — and the Lighthouse lab performance score as a caption that says it is a lab figure. A
lab-sourced value MUST say it may vary between runs; a missing INP MUST say why there is none. The
block MUST state "Measuring…", "Couldn't refresh: <reason>, showing the measurement from <date>",
"Couldn't measure: <reason>", "Not measured" and "PageSpeed not configured" in words, never as
empty cards; when PageSpeed's state is `keyRejected` it MUST open with "Google rejected the
PageSpeed key — speed measurements are paused. See the README." above whatever is stored.

#### Scenario: an origin-sourced INP
- **WHEN** the page's INP is 240 ms from the whole site's real visitors
- **THEN** the INP card reads "240 ms", "Needs improvement", "Real visitors to the whole site" and
  the date

#### Scenario: the last attempt failed
- **WHEN** the summary is `failed` with `PSI_UNAVAILABLE` and holds a measurement from Oct 8
- **THEN** the block shows the Oct 8 cards under "Couldn't refresh: Google's PageSpeed service did
  not answer after several tries. Showing the measurement from Oct 8."

#### Scenario: Google rejected the key
- **WHEN** the detail says `state: 'keyRejected'` and the page has a measurement from Oct 8
- **THEN** the block opens with the key-rejected notice and still shows the Oct 8 cards

### Requirement: PAGEDETAIL-012 — the score's explanation says speed is scored separately

The score explanation MUST state that Core Web Vitals are shown in the Speed block and listed as
issues but do not change the score, and why; the arithmetic it shows MUST be unchanged.

#### Scenario: a page with a poor LCP
- **WHEN** the detail of a page carrying `CWV_LCP_POOR` is opened
- **THEN** the explanation's arithmetic uses the same applicable and failed counts as before the
  finding, and a paragraph says speed is scored separately
