## ADDED Requirements

### Requirement: ANALYSIS-024 — a broken link in the text is reported, and an external one only when it is certainly gone

A page MUST be reported as `BROKEN_LINKS`, a notice, when a content link it checked is broken.
An internal link (same site key) is broken on any final 4xx or 5xx except 401, 402, 403 and 429,
which refuse the crawler rather than describe the page, on a domain that does not exist, or on
too many redirects; an internal link that redirects off the site is judged as an external one.
An external link is broken only on a final 404 or 410, or on a domain that does not exist. A
401, 403, 429, 999, 5xx, timeout, refused connection or temporary DNS failure on an external
link MUST NOT be reported, and neither MUST any answer reached through a third host on the way
(a consent or login wall). Cloudflare's `/cdn-cgi/` addresses MUST NOT be checked: they are no
pages. The external rule MUST be stated in the
code's catalogue explanation and MUST be read from one constant. A test MUST tie the two. A link
to this site's development, staging or preview host MUST be skipped, never counted as broken or
checked: it is `DEVELOPMENT_HOST_REFERENCES`'s finding, decided by the predicate that check
applies to content links.

#### Scenario: a link to the site's staging host
- **WHEN** a post links to `https://staging.a.example/draft/`, which answers 404
- **THEN** `BROKEN_LINKS` does not report it, and `DEVELOPMENT_HOST_REFERENCES` does

#### Scenario: an external page behind a bot wall
- **WHEN** a post links to an external page that answers 403
- **THEN** the link is not reported, and does not count as checked

#### Scenario: the site's own pages refuse the crawler
- **WHEN** an internal link answers 429 because of the crawl's own pace
- **THEN** the link is not reported, and does not count as checked

#### Scenario: a channel behind a consent wall
- **WHEN** an external link redirects through `consent.youtube.com` and ends on a 404
- **THEN** the link is not reported

#### Scenario: an external page removed
- **WHEN** a post links to an external page that answers 410
- **THEN** `BROKEN_LINKS` is reported quoting the link and the status

#### Scenario: someone adds 403 to the constant
- **WHEN** 403 is added to the external-broken statuses and the explanation is unchanged
- **THEN** the test tying the explanation to the constant fails

### Requirement: ANALYSIS-025 — a link to this site that redirects is reported

A page MUST be reported as `LINKS_TO_REDIRECTS`, a notice, when an internal content link it
checked redirects to a page that answers 2xx, quoting the link, the hops and the final URL. A link
already reported by `INTERNAL_LINK_VARIANTS` (plain HTTP, the other www-variant, a tracking
parameter) MUST NOT also be reported here, nor a link to this site's development host
(`DEVELOPMENT_HOST_REFERENCES`'s). An external redirect MUST NOT be reported.

#### Scenario: a moved post still linked by its old address
- **WHEN** a post links to `/old-guide/`, which answers 301 to `/guide/`
- **THEN** `LINKS_TO_REDIRECTS` is reported with the hop

#### Scenario: a plain-HTTP link on an HTTPS site
- **WHEN** a post links to `http://a.example/guide/`, which redirects to https
- **THEN** `INTERNAL_LINK_VARIANTS` reports it and `LINKS_TO_REDIRECTS` does not

### Requirement: ANALYSIS-026 — a canonical whose target redirects, errors, is noindexed or is canonicalised again is reported

A page whose first declared canonical names another URL MUST be reported as
`CANONICAL_TARGET_BROKEN`, a warning, when that target redirects, answers 4xx or 5xx, answers 200
with noindex, or answers 200 declaring a canonical to yet another URL. The target MUST be judged
from the run's own page when it is one, else from one document read under the crawl's document
budget. A target that could not be read MUST make the check not applicable, never passed.

The check MUST be not applicable when the canonical is the page's own http:// twin
(`CANONICAL_TO_HTTP`'s) or when the target is a development, staging or preview host
(`DEVELOPMENT_HOST_REFERENCES`'s).

When the check fails, `CANONICAL_MISMATCH` MUST be not applicable for that page: the broken
target is the more specific finding. Both MUST decide "the target is broken" with one shared
predicate over the same outbound facts. When the target was not read, `CANONICAL_MISMATCH` MUST
judge as it does without outbound facts.

`SITEMAP_LISTS_NON_INDEXABLE` MUST still name such a page's sitemap entry "names <url> as
canonical", reading the canonical from the `CANONICAL_TARGET_BROKEN` finding.

#### Scenario: a canonical naming a moved URL
- **WHEN** a post's canonical names `https://a.example/old/`, which answers 301
- **THEN** `CANONICAL_TARGET_BROKEN` is reported quoting the declaration and the redirect, and
  `CANONICAL_MISMATCH` is not applicable

#### Scenario: a target that was not read
- **WHEN** a post's canonical names another URL that the document budget could not reach
- **THEN** `CANONICAL_TARGET_BROKEN` is not applicable and `CANONICAL_MISMATCH` is reported, as
  without outbound checks

#### Scenario: an http-twin canonical
- **WHEN** an https post's canonical is its own http:// address, which redirects to https
- **THEN** `CANONICAL_TO_HTTP` is reported and `CANONICAL_TARGET_BROKEN` is not applicable

#### Scenario: the sitemap entry of a page whose canonical target is broken
- **WHEN** a fetched sitemap entry's page carries `CANONICAL_TARGET_BROKEN` naming
  `https://a.example/old/` and no `CANONICAL_MISMATCH`
- **THEN** `SITEMAP_LISTS_NON_INDEXABLE` lists the entry with "names https://a.example/old/ as
  canonical"

#### Scenario: a canonical chain
- **WHEN** the target answers 200 and itself declares a canonical to a third URL
- **THEN** `CANONICAL_TARGET_BROKEN` is reported as a chain, quoting both hops

#### Scenario: a target over the budget
- **WHEN** the target is outside the run and the document budget is spent
- **THEN** the check is not applicable for that page

### Requirement: ANALYSIS-027 — hreflang alternates that do not link back are reported

A page with hreflang alternates MUST be reported as `HREFLANG_NOT_RECIPROCAL`, a warning, when an
alternate other than itself and `x-default` answers 200 HTML at its own URL and declares no
hreflang alternate naming this page, quoting each such alternate. An alternate that redirected,
failed, was not 200 HTML, or was not read MUST NOT be judged, and a page none of whose alternates
could be read MUST be "not applicable".

What an older check reports MUST NOT be judged here:

- an alternate whose language or region code `HREFLANG_INVALID` reports, decided by the same
  validator, MUST be skipped;
- an alternate on a development, staging or preview host (`DEVELOPMENT_HOST_REFERENCES`'s) MUST
  be skipped;
- a page whose first declared canonical names another URL MUST be not applicable, because it
  has left its own hreflang set (`HREFLANG_INVALID`'s canonical-elsewhere arm).

#### Scenario: an alternate with a country code for a language
- **WHEN** a post names a `ua` alternate that answers 200 and does not link back
- **THEN** `HREFLANG_INVALID` reports the code and `HREFLANG_NOT_RECIPROCAL` does not judge that
  alternate

#### Scenario: a page canonicalised elsewhere
- **WHEN** a post with alternates declares another URL as its canonical
- **THEN** `HREFLANG_NOT_RECIPROCAL` is not applicable

#### Scenario: a French version without the return link
- **WHEN** an English post names `https://a.example/fr/post/`, which answers 200 and lists only
  itself and a German version
- **THEN** `HREFLANG_NOT_RECIPROCAL` is reported naming the French URL

#### Scenario: an alternate that redirects
- **WHEN** the named alternate answers 301
- **THEN** it is not judged by this check
