---
name: search-engines
description: How search engines actually crawl, render, index, rank and summarise pages, and how the SEO industry measures that — the external-world knowledge behind this repository's page analysis. Read before adding or re-tuning an SEO rule or threshold, before changing keyword extraction, before deciding what a page score means, and before building anything that claims a real search position. Background only: it records findings and open questions, and decides nothing.
---

# Search engines

This skill is **knowledge about the outside world**, not a convention of this repository. Nothing
in it is about our tables, our modules or our screens — strike out every product name and every
sentence still stands. That is why it sits in `practices/` and not in `skills/`.

## Status: acted on, and still binding nothing by itself

It was written to be drawn on by work that **starts after the current screens change ships**. That
condition has been met, and the conversation it was waiting for has happened. The OpenSpec changes
`seo-check-catalogue-correction`, `page-health-score` and `site-wide-issue-grouping` acted on these
findings: SLOW_RESPONSE and KEYWORD_NOT_IN_TITLE retired (findings 3 and 4),
STRUCTURED_DATA_MISSING added (finding 8), and the extraction defect of finding 7 fixed. The
catalogue is eighteen codes, not the nineteen described below. Why each was decided that way lives
in those changes and in `be/src/modules/page-analysis/PAGE_ANALYSIS_MODULE.md`, never here.

**This skill still decides nothing**, and the change to its status is only that: its findings are
no longer unexamined. Where the research meets our implementation, a finding is still recorded
here as an *observation* or an *open question* and stops there. The references are untouched — a
field study is a record of a day, and is never rewritten to match what was later done about it.

## What to read, and when

| Reference | Read it before |
| --- | --- |
| [`how-search-works.md`](references/how-search-works.md) | touching the crawler, sitemap discovery, robots handling, canonical or indexing rules |
| [`ranking-signals.md`](references/ranking-signals.md) | adding or re-tuning an SEO rule, or deciding what a page score may claim |
| [`keywords-and-intent.md`](references/keywords-and-intent.md) | changing keyword extraction, or deciding what the word "keyword" promises a user |
| [`ai-search.md`](references/ai-search.md) | anything about AI answers, AI crawlers, or `llms.txt` |
| [`field-study-2026-10.md`](references/field-study-2026-10.md) | arguing about a threshold — it holds measurements from live sites, including ours firing on them |

## Three rules for reading any of it

**Separate what Google documents from what the industry believes.** Every claim in these
references is tagged `[official]` when it comes from Google's own documentation, and `[industry]`
when it comes from practitioners measuring Google from outside. The second kind is often right and
is never a specification: it shifts, it is sometimes inferred from correlation, and vendors who
sell audits have an interest in there being more to fix. A threshold justified only by
`[industry]` sources is a judgement call, and whoever sets it owns it.

**Google's documentation describes intent, not a scoring function.** There is no public formula,
no published weight, and no list of ranking factors with numbers attached. Anything that presents
one is a model of Google, not Google. Our analysis is in exactly the same position, and should say
so wherever it shows a number to a user.

**A threshold with no cited source is an invention.** Every numeric bound our catalogue carries —
title length, description length, word count, response time, page size — is currently a number
without a reference next to it. That is not a defect to fix in passing; it is a thing to know
while reading a rule, and `field-study-2026-10.md` shows what several of those numbers do when met
with real pages.

## The one distinction that matters most

**On-page analysis and search performance are different subjects**, and conflating them is the
most expensive mistake available here.

What a crawler can see in HTML — a title, a heading, a canonical link, a word count — is a
description of the document. Whether a page ranks is a function of the query, the competing
documents, the site's reputation and the searcher's intent, none of which are in the HTML. A page
can pass every check we have and rank nowhere; a page can fail several and rank first.

So a technical audit is a hygiene statement: *nothing here is obviously broken*. It is useful, it
is cheap, and it is honest only while it does not pretend to be a prediction. Every reference here
is organised around that line.
