# Field study — keyword extraction against two Canadian sites, 2026-10-04

Measurements, not advice. A companion to [`field-study-2026-10.md`](field-study-2026-10.md),
which measured the SEO rules; this one measures **keyword extraction** and was run to answer one
question: how much of what the catalogue stores is a term a person would search for?

## Method

Each run below went through this repository's own `extractPage` and `extractKeywords`,
unmodified, one crawl run at a time so the IDF step had its corpus.

- **semrush.com/blog, yoast.com** — the recorded fixtures under `be/test/fixtures/sites/`, so
  these numbers are reproducible without the network.
- **ratehub.ca/blog** — 15 posts from the top of `blog-sitemap.xml`, fetched once each.
- **canadiangeographic.ca/articles** — 15 posts from the tail of
  `wp-sitemap-posts-articles-3.xml`.

Both live sites were checked against `robots.txt` first. Two other candidates were dropped for
that reason: canadianliving.com disallows `Claude-Web`, cottagelife.com disallows `GPTBot` and
`CCBot`. The fetch scripts lived in the scratchpad and were deleted.

The two Canadian sites were chosen to be unlike the recorded pair. Ratehub is consumer finance
with commercially targeted headlines and a bilingual en-CA / fr-CA corpus; Canadian Geographic is
a WordPress magazine whose headlines are written to be read, not searched.

## Limits — read before quoting any number

- **Four sites, 72 pages.** Enough to find defects; not a basis for a rate.
- **Keyword quality was graded by hand,** by one reader, against the page. The split between a
  real query and an acceptable-but-off term is a judgement, not a measurement. The junk column is
  the firmer of the three.
- **No search-volume data.** Nothing here checks that a term is *actually* searched; the grading
  asks only whether it has the shape of a query rather than of a sentence.
- **One fetch per page, server HTML only, no rendering.**

## What the grading found, before and after

Semrush and Yoast, the two recorded sites, graded on the same 42 pages:

| | keywords | a real query | acceptable | junk |
| --- | --- | --- | --- | --- |
| before | 171 (4.1/page) | 25% | 19% | 56% |
| after | 88 (2.1/page) | ~50% | ~19% | ~31% |

The count halving is the point: nearly all of what went was the tail. Of the 42 pages, the top
keyword was wrong on 3 before and on 0 after.

## Findings

**1. The apostrophe became a space, so the suffix survived as a token.**
`facebook s algorithm changes`, `beginner s step`, `let s play` — three visibly broken terms in
30 pages. Folding a contraction into its stem also *joins* what was one word all along: the
Facebook post went from eight near-tied keywords to one clear `facebook algorithm`.

**2. French elides in front, and the same fix broke it.** `L'abordabilité s'est améliorée` became
`labordabilité` and `sest améliorée`. The particle is a closed set of one or two letters, and a
word boundary before it is what tells `l'abordabilité` from the English possessive in
`the dogs' bowls`. A Toronto agency's clients include Quebec sites; this is not an edge case.

**3. A heading was counted twice — three times with a table of contents.** `BLOCK_ELEMENTS`
included the headings, so an h2 scored its subheading weight *and* a body frequency it never
earned in prose. Seven of the AI-search post's eight keywords were its own table of contents:
`add specific statistics`, `start this week`, `next seo frontier`.

**4. A repeated in-page label outscores the subject.** semrush.com prints `Quick action:` before
twenty paragraphs of one post. Twenty body occurrences of a two-word label made it that page's
second keyword. The run-level boilerplate pass cannot see it — it is one page's habit, not the
site's — and the IDF step sees it on one page and *rewards* it.

**5. Eight keywords was a budget no page could spend honestly.** A 585-word post returned
`food and drinks`, `awesome line` and `venue and nijmegen` to fill it. Yoast averaged 5.4
keywords per page against Semrush's 3.1 while its posts were half the length — the dependency ran
backwards.

**6. Four-token candidates stored the title one word short, and it was the word that mattered.**
`email performance in google`, `technology report in google`, `dimensions in google analytics` —
each the page's top keyword, each shown first in the UI, each visibly broken. Five-token
candidates fix it but let a whole headline swallow the subject (`reasons to come to yoastcon`
took the page from `yoastcon`), so subsumption is now capped at two added tokens.

**7. A bare word out of an already-chosen phrase is its leftover.** `url` beside `remove www`,
`reasons` beside `yoastcon`, `exercises` beside `google analytics`, `blog` beside
`google analytics segments`. The word that *is* the subject is unaffected: it ranks first, before
any sentence is spoken for.

**8. The corpus penalty charged a page for its own title.** Yoast has three posts about Facebook
traffic — enough that `facebook traffic` paid a third of its score and "Facebook traffic: What's
the current status?" was filed under `current status`. Relief for an anchored term has to be
gated on document frequency, though: forgiving it outright made `google analytics` the keyword of
every Google Analytics post, and on Semrush it handed a 3,300-word guide to `ai search` and left
nothing above the floor.

**9. A class fragment matching a layout modifier deleted the page.** ratehub.ca wraps its article
in `<div class="content-layout … with-sidebar">`. `[class*="sidebar" i]` took 1,899 of the page's
1,999 words, and **fourteen of fifteen posts were stored as empty, with no keywords at all**.
Neither recorded site could show this; both happen to name their wrappers otherwise. A matched
node holding more than half the main content is now kept.

**10. The post is not the card beside it.** canadiangeographic.ca does not wrap the post in an
`<article>`; the related-post cards under it are `<article>`s with an `<h1>` each. "The first
`<article>` holding an h1" selected the first card, and **fifteen of fifteen** features were read
as ~30 words. The rule still earns its place — it is what keeps travelsmart.bg's related posts out
of its destinations — but an `<article>` must hold a share of the page before it is read as the
post rather than as a card listing one.

Findings 9 and 10 are the reason to run against unfamiliar sites at all. Both are total failures,
both are silent, and both were invisible across 42 pages of the two sites the test suite records.

## Left alone on purpose

- **Captions.** canadiangeographic.ca ends seven of one feature's captions with
  `(Photo: Yukon Archives, Photography Unit, 2006/91, temp file 6)`, and `temp file` became that
  article's second keyword. Dropping `figcaption` from the body removes it — and costs
  `magdeleine vallieres`, the cyclist a post is *about*, along with four named resorts and a
  safari camp. A magazine keeps its proper nouns in its captions.
- **The second window of a long headline.** "Canadian astronaut Joshua Kutryk launches on
  long-term mission to International Space Station" carries no punctuation, so it yields several
  non-overlapping windows and the cap of two per sentence admits one fragment. Tightening the
  overlap ratio only changed which fragment it was; capping a run at one keyword cost more than it
  saved, because a slug is one run and merges what the title's punctuation separated.
- **Digits cannot bound a phrase,** so "HTTP/2" stores as `http` and "WordPress 5.0" as
  `wordpress`. Relaxing it readmits `2025`-shaped noise on every dated listicle.

## The ceiling this hits

Every fix above is structural: something was counted twice, deleted wrongly, or spent on a budget
it had not earned. What remains is not. `start this week`, `food and drinks` and `save money` are
perfectly salient in their pages and perfectly useless as keywords, because the scoring measures
**salience within a document** and a keyword is a **search query**. Nothing inside a single page
tells the two apart. Closing that gap needs a signal from outside it — a frequency corpus, an
n-gram model, or a judge asked whether a phrase is a thing people type — and no amount of weight
tuning substitutes for one.

## Reproducing this

The two fixture runs need no network:

```bash
pnpm --filter be exec jest src/modules/page-analysis
```

For the live runs, rebuild the fetch script from the Method section: read `robots.txt`, take 15
article URLs from the sitemap, fetch each once, and pass the set to `extractKeywords` as one run.
