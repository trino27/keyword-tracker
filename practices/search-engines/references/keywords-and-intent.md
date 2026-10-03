# Keywords: what the word means, and what a page can tell you

Background for keyword extraction. Tags: `[official]` = Google's documentation, `[industry]` =
practitioners.

## Two different things share the name

**A keyword, to an SEO practitioner, is a query** — something people type, carrying a search
volume, a difficulty, and an intent. It exists in search logs, not on the page.

**A keyword, to a text analyser, is a salient term** — something the document emphasises. It
exists on the page, and can be computed from it alone.

These coincide often enough to be confusing and diverge often enough to matter. A page can be
emphatically about a phrase nobody searches for. A page can rank for a query that appears nowhere
in its text, because Google matches meaning and not strings.

Any feature naming "keywords" has to pick one meaning and say which. The honest statement for a
term extracted from HTML is *what this page presents itself as being about*.

## Intent: the taxonomy everyone uses

Four categories, near-universal in the industry: `[industry]`

| Intent | The searcher wants | Surface signals |
| --- | --- | --- |
| Informational | to know | "how to", "what is", "guide", "tutorial" |
| Navigational | to reach a specific place | a brand or product name |
| Commercial | to compare before acting | "best", "vs", "review", "alternatives" |
| Transactional | to act now | "buy", "price", "discount", "order", "coupon" |

The practitioner's method is not to classify the words but to **read the SERP**: Google has
already decided what the query means, and the result page shows it. Featured snippets and "people
also ask" cluster on informational queries; shopping ads and product carousels on transactional
ones; a local pack signals local or navigational intent. `[industry]`

This is worth noticing as a method. Intent is read from the *result page*, not from the query
string and not from the document — so a tool with no SERP access can infer intent only from word
patterns, which is the weakest of the three positions.

## How keyword work is actually done

The standard loop: define the goal and audience; gather candidates; segment them by intent; group
them into themes or clusters; judge each on relevance, volume, difficulty and the shape of its
SERP; then revisit as performance data arrives. `[industry]`

Where the numbers come from:

- **Google Search Console** — the queries a site actually appeared for, with impressions, clicks,
  CTR and average position. It is first-party, free, limited to one's own verified property, and
  it is the only source on this list that reports truth rather than an estimate. `[official]`
- **Keyword tools** (Ahrefs, Semrush, and others) — volume and difficulty estimates, modelled from
  clickstream and index data. Estimates, and they disagree with each other. `[industry]`
- **SERP data** — what currently ranks, and which result features appear. Obtained by scraping or
  by a paid API. `[industry]`

## What Google says it reads on the page

Google's own framing is that it considers all the content on a page to determine the topic, with
the title element, headings, URL and prominent text used as clues to relevance. `[official]` The
most basic relevance signal it names is that the content contains the words of the query —
appearing on the page, in headings, in the body. `[official]`

That ordering is the honest basis for weighting fields: **title and heading over body** is
supported by Google's description of what it reads. The particular multipliers are not.

## How this repository's extraction works, stated neutrally

Not a judgement, just the shape, so the observations below can be read against it:

- Candidates are words and phrases up to three tokens, stop-worded per detected language.
- Each candidate scores by **where** it appears — title, `h1`, slug, meta, subheading, first
  paragraph, body — with body contributing by frequency on a log scale rather than by presence.
- Bonuses: appearing in several deliberately authored fields; being declared by the page itself
  (JSON-LD `keywords`, `article:tag`); a slight preference for multi-word phrases.
- A **corpus penalty (IDF)** computed across the pages of one crawl run, so a term appearing on
  every page of a site — its name, its product — is damped. A brand suffix is stripped from the
  title before scoring.
- Overlapping candidates are subsumed, then five to eight survive above a floor relative to the
  top score.

The IDF step and the brand stripping are deliberate answers to a real failure mode, and they are
the part of this design most clearly supported by the material above: they stop a site's own
vocabulary from being mistaken for every page's topic.

## Observations from live pages

Measured 2026-10-03 on fifteen articles across three publishers; detail in
[`field-study-2026-10.md`](field-study-2026-10.md). Extraction itself was graded against four
sites on 2026-10-04 — see
[`field-study-2026-10-04-canada.md`](field-study-2026-10-04-canada.md), which is the better
starting point before changing a scoring constant, and which ends on the ceiling every one of
these heuristics shares: the scoring measures salience within a document, and a keyword is a
search query.

- **The declared-keyword bonus never applied *on this sample* — but it is not dead.** None of
  the fifteen pages emitted JSON-LD `keywords` or `article:tag`, while 20 of the 23 recorded
  Yoast fixtures in this repository do. Bespoke technology blogs declare nothing; WordPress and
  Yoast sites declare keywords routinely, and those are the sites an agency actually tracks.
- **The "top keyword not in the title" rule did not fire once, and structurally can barely
  fire.** Title presence is the single largest contributor to a candidate's score, so the top
  keyword is nearly always a title term. The rule is close to a tautology rather than a check.
- **Overlapping variants survive selection.** One page returned `post quantum`,
  `post quantum cryptography` and `uses post quantum` among six keywords — three slots spent on
  one idea. Subsumption collapses containment by score ratio, not by meaning.
- **Hidden interface text leaks into keywords.** Vercel's headings contain a copy-link control
  whose label reads "Copy link to heading". The extractor concatenates adjacent text without a
  separator, so the `h2` text became `Copy link to headingAgentic infrastructure`, and
  `headingagentic infrastructure` and `headingthe future` were returned as keywords for that
  page. Two distinct causes: no separator between text nodes, and no filtering of
  accessibility-only control labels.
- **Otherwise the output is plausible.** `digital pr`, `b2b seo`, `cloudflare radar`,
  `post quantum cryptography` are fair descriptions of their pages. As *what is this page about*,
  the heuristic works. As *what should this page rank for*, it was never positioned to answer.

## Open questions this raises

- Does the product promise "what this page is about" or "what this page should target"? The two
  need different data and different words on screen.
- Is Search Console worth its cost here — per-client OAuth, verified-property access, quota — and
  does it belong to keywords, to positions, or to both?
- Should extracted terms be reconciled against observed queries when both exist, and what does a
  disagreement between them mean to a user?
- Should a term the page emphasises but no one searches be shown at all, and can that even be
  known without volume data?

## Sources

Official:
- [How Google Search works — relevance](https://developers.google.com/search/docs/fundamentals/how-search-works)
- [Google Search Console](https://search.google.com/search-console/about)

Industry:
- [What is keyword research? How to analyse keywords](https://searchatlas.com/blog/keyword-research/)
- [Search intent 101](https://ezycourse.com/blog/keyword-search-intent)
- [Search intent: what is it and why it matters](https://mangools.com/blog/search-intent/)
- [Transactional vs informational keywords](https://valveandmeter.com/blog/seo/transactional-informational-keywords/)
- [How Google uses keywords](https://www.practicalecommerce.com/how-google-uses-keywords)
- [Keyword research — Wikipedia](https://en.wikipedia.org/wiki/Keyword_research)
