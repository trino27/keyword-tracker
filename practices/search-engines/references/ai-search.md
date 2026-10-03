# AI answers, AI crawlers, and the claims around them

The fastest-moving and least settled area in this skill. Read it with more suspicion than the
others: much of the available writing is vendor marketing for a category those vendors invented,
and the stable facts are few.

## What exists

**AI Overviews** are the AI-generated summary blocks above the conventional results on Google.
**AI Mode** is Google's conversational search interface. Alongside them, ChatGPT, Perplexity,
Copilot and Claude answer questions that would previously have been searches, citing a handful of
sources each. `[industry]`

The practical consequence people are responding to: where ranking once meant placement among ten
links, being cited in a generated answer means being among the two to seven sources a model
quotes. `[industry]`

## GEO — what the term covers

**Generative Engine Optimization** is the label for structuring content, entity presence and
technical setup so generative engines cite you. `[industry]`

The one claim in this space that is consistently made and is consistent with everything else in
this skill: **GEO builds on SEO rather than replacing it**. A page must still be crawlable and
indexable; then its passages must be clear, current and specific enough to be worth quoting.
`[industry]`

Treat the rest of the GEO literature as unverified. There is no published mechanism, no
documented signal, and the field is young enough that its practitioners are describing
correlations across a handful of months.

## llms.txt

A proposed convention, modelled on `robots.txt`, by which a site names the pages it considers
authoritative for AI engines, often as clean Markdown. `[industry]`

What is actually known: it is **not a ratified standard and not a confirmed signal in any
published algorithm**. Its defensible purposes are practical rather than ranking — serving agents
cheap clean text instead of script-heavy HTML, and stating topical authority to whatever chooses
to read it. `[industry]`

## AI crawler controls, which are real and checkable

Separate from any of the above, sites increasingly write `robots.txt` rules for named AI agents —
`GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, `CCBot`, `Bytespider`. This is ordinary
`robots.txt` mechanics and needs no new theory. Whether an agent obeys is a property of that
agent.

**Measured 2026-10-03** (detail in [`field-study-2026-10.md`](field-study-2026-10.md)): of three
sites whose `robots.txt` was read, one (`moz.com`) carried a `GPTBot` rule; the other two named no
AI agent at all. A small sample, and the only point it supports is that the practice exists and
is far from universal.

## Why this matters to a rank tracker at all

If some share of a client's audience gets its answer from a generated summary without clicking,
then position in the conventional results stops being a complete account of visibility — the
position can hold while traffic falls. That is a reason to be careful about what a position chart
is said to mean, not a reason to build anything.

Measuring AI citation is its own problem, requiring repeated prompting of several engines and no
stable notion of "position". Nothing in this repository is close to it, and no part of this
skill suggests it should be.

## Open questions this raises

- Does "latest rank position" need qualifying language once AI answers intercept clicks, and is
  that a product wording question rather than a measurement one?
- Are AI-crawler directives in a client's `robots.txt` worth reporting to an agency as
  information, given they are neither an error nor under our control?

## Sources

All `[industry]`; there is no official documentation for most of this.
- [Mastering generative engine optimization in 2026 — Search Engine Land](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142)
- [Generative engine optimization — Wikipedia](https://en.wikipedia.org/wiki/Generative_engine_optimization)
- [GEO: the complete 2026 guide — Similarweb](https://aisearch.similarweb.com/blog/what-is-geo/)
- [AI search in 2026](https://controlaltdigital.com/ai-search-in-2026-the-complete-guide-to-seo-and-geo/)
