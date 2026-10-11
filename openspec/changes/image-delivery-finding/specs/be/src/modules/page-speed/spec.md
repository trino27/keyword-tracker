## ADDED Requirements

### Requirement: SPEED-015 — images Lighthouse says could be at least 100 KiB lighter are one finding, from the mobile answer

On each successful mobile measurement, the worker MUST store `IMAGE_DELIVERY_INEFFICIENT`, a
notice, when Lighthouse's image-delivery audit in that answer fails and its estimated savings
reach the catalogue's `min` (102 400 bytes). Its details MUST carry the savings in bytes, the
`min` it was judged against, and at most ten images with their own savings, largest first. A
desktop answer MUST NOT produce it. An answer without the audit, or with an audit that does not
parse, MUST produce no image finding and MUST still be stored as a Core Web Vitals measurement,
never as a failed attempt. The finding MUST be replaced with the rest of that strategy's speed
findings.

#### Scenario: a page with oversized images
- **WHEN** a mobile answer's image-delivery audit fails with 245 000 bytes of savings over 4 images
- **THEN** `IMAGE_DELIVERY_INEFFICIENT { value: 245000, min: 102400, images: [4 entries] }` is
  stored

#### Scenario: just under the bar
- **WHEN** the audit fails with 102 399 bytes of savings
- **THEN** no image finding is stored

#### Scenario: Lighthouse renames the audit
- **WHEN** a mobile answer carries LCP, CLS and a performance score but no image-delivery audit
- **THEN** the measurement is stored `done` with its CWV findings, and no image finding

#### Scenario: a desktop answer
- **WHEN** a desktop answer's image-delivery audit fails with 500 000 bytes of savings
- **THEN** no `IMAGE_DELIVERY_INEFFICIENT` is stored for it
