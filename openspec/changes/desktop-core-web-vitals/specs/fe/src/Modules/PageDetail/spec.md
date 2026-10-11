## MODIFIED Requirements

### Requirement: PAGEDETAIL-011 — the page shows its Core Web Vitals with their source and age

The detail MUST show a "Speed (Core Web Vitals)" block with a Mobile | Desktop switch that opens on
Mobile. For the chosen device it MUST show one card per metric — the value with its unit, the band
in words and colour, the source in plain words and the date measured — and the Lighthouse lab
performance score as a caption that says it is a lab figure. A lab-sourced value MUST say it may
vary between runs; a missing INP MUST say why there is none. For the chosen device the block MUST
state "In queue for measurement", "Measuring…", "Couldn't refresh: <reason>, showing the
measurement from <date>", "Couldn't measure: <reason>", "Not measured" and "PageSpeed not
configured" in words, never as empty cards; when PageSpeed's state is `keyRejected` it MUST open
with "Google rejected the PageSpeed key — speed measurements are paused. See the README." above
whatever is stored, on either device. Switching devices MUST NOT request anything.

Modified by `desktop-core-web-vitals`: the page is now measured on two devices (plan D9), and the
block shows one at a time, behind a switch, so the cards keep the layout a reader already knows.

#### Scenario: an origin-sourced INP
- **WHEN** the page's mobile INP is 240 ms from the whole site's real visitors
- **THEN** the INP card on Mobile reads "240 ms", "Needs improvement", "Real visitors to the whole
  site" and the date

#### Scenario: the last attempt failed
- **WHEN** the mobile summary is `failed` with `PSI_UNAVAILABLE` and holds a measurement from Oct 8
- **THEN** the block on Mobile shows the Oct 8 cards under "Couldn't refresh: Google's PageSpeed
  service did not answer after several tries. Showing the measurement from Oct 8."

#### Scenario: Google rejected the key
- **WHEN** the detail says `state: 'keyRejected'` and the page has a measurement from Oct 8
- **THEN** the block opens with the key-rejected notice and still shows the Oct 8 cards

#### Scenario: a page never measured on desktop
- **WHEN** the reader switches to Desktop on a page whose desktop summary is null
- **THEN** the block says "Not measured" and makes no request
