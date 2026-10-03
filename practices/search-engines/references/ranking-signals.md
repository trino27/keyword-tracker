# What actually moves a page, and what a score may claim

Background for adding or re-tuning an SEO rule. Tags: `[official]` = Google's documentation,
`[industry]` = practitioners measuring from outside.

## There is no list of ranking factors with numbers

Google publishes guidance about intent and quality, not weights. Nobody outside Google has the
function. Every "top 200 ranking factors" post is a model built from correlation and testimony.
Holding this straight is the difference between a tool that informs and a tool that misleads.

What follows is grouped by how firm the ground is.

## Firm: the page must be reachable and declare itself

Covered in [`how-search-works.md`](how-search-works.md). A page that cannot be crawled, that
blocks indexing, or that nominates a different canonical, does not rank — not because of a weight
but because it never enters the running. These are the checks worth stating as errors, and they
are the minority of any audit list.

## Firm-ish: titles and descriptions, with a large caveat

Google builds the **title link** shown in results from several sources — the `<title>` element,
the visible heading, prominent text on the page, and link text pointing at it — and says the
`<title>` is how you state a preference, not how you set the result. `[official]`

The caveat is the important part:

- Meta descriptions are **rewritten by Google roughly 62% of the time**, typically when the
  description does not match the query the user typed, in which case Google pulls a passage from
  the page instead. `[industry]`
- Titles get rewritten too, and industry observation is that a title which contradicts the page's
  `h1` invites it — Google often prefers the `h1`. `[industry]`

Prevailing industry advice converges on roughly **50–60 characters** for a title (the real limit
is pixel width, around 600px, not characters) and **150–155 characters** for a description.
`[industry]` Google itself publishes no character limit; its guidance is descriptive and unique
per page. `[official]`

**Observation against our catalogue.** Our thresholds are 30–60 for titles and 70–160 for
descriptions. On fifteen live blog pages from three competent publishers, `TITLE_LENGTH` fired on
nine and `META_DESCRIPTION_LENGTH` on seven — see
[`field-study-2026-10.md`](field-study-2026-10.md). A rule that flags the majority of
professionally produced pages is reporting a house style, not a defect. Whether that is wrong
depends on what the agency wants the tool to say, which is an open question, not a bug.

## Softer: content quality, E-E-A-T, helpfulness

**E-E-A-T** — Experience, Expertise, Authoritativeness, Trustworthiness — is the framework in
Google's *Search Quality Rater Guidelines*, a document used to train human raters who score
sample results. The guidelines are public; the latest revision is dated 11 September 2025.
`[official document, industry reading]`

Two things are routinely misstated about it:

- **It is not a ranking factor.** Raters do not change rankings; they evaluate changes. E-E-A-T
  describes what Google is *aiming* at, and shapes the signals it builds. `[industry]`
- **Trust is the load-bearing leg.** The guidelines treat a page with low trust as low quality
  regardless of the author's demonstrated expertise. `[industry]`

The September 2025 revision added handling for AI Overviews and widened the YMYL ("your money or
your life") category to cover elections, civic bodies and government trust; raters are also now
asked to assess whether content appears AI-generated. `[industry]`

**None of this is measurable from HTML.** An author byline, a date and an `Article` schema are
proxies for provenance, not evidence of expertise. A tool that scores "E-E-A-T" from markup is
scoring markup.

## Measurable but easy to misreport: page experience

**Core Web Vitals** thresholds, stable as of 2025: `[official thresholds, industry summary]`

| Metric | Good | Needs improvement | Poor |
| --- | --- | --- | --- |
| LCP — largest contentful paint | ≤ 2.5 s | 2.5–4.0 s | > 4.0 s |
| INP — interaction to next paint | ≤ 200 ms | 200–500 ms | > 500 ms |
| CLS — cumulative layout shift | ≤ 0.1 | 0.1–0.25 | > 0.25 |

INP replaced FID in 2024. `[industry]` Two properties of these metrics matter more than the
numbers:

- **They are field metrics at the 75th percentile.** A page passes when 75% of real visits meet
  the threshold. A single measurement from one machine is not a Core Web Vital, and cannot be
  compared with one. `[industry]`
- **Google states page experience is one input, not a dominant standalone factor.** `[official]`

For scale: the 2025 Web Almanac reports about 48% of mobile and 56% of desktop sites passing all
three, with LCP the usual failure. `[industry]`

**Observation against our catalogue.** `SLOW_RESPONSE` measures time-to-first-byte once, from
wherever the crawler happens to run, and compares it to 1500 ms. In the field study it fired three
times on one site, whose TTFB from the same machine ranged 41 ms to 1728 ms across five fetches —
a tenfold spread driven by caching and network distance, not by the pages. The measurement is
real; calling it a property of the page is the error.

## Measurable and concrete: structured data

Google's `Article` type has **no required properties** — the guidance is to include what applies.
`[official]` Recommended and high-impact in practice: `headline`, `image`, `datePublished`,
`dateModified`, `author`, `publisher`. `[industry]`

Specifics worth knowing: headlines beyond 110 characters are truncated and may suppress the rich
result; images should be at least 50,000 pixels in area with 16:9, 4:3 and 1:1 variants supplied;
a publisher logo must be rectangular. `[industry]`

Crucially, **correct markup earns eligibility, not display**. Google decides whether to show a
rich result using content quality and E-E-A-T signals as well as the markup. `[industry]`

**Observation.** Our extractor already reads JSON-LD types and keywords, and the catalogue has no
rule about them. In the field study, two of three sites emitted `Article`/`BlogPosting` and one
emitted none at all — so the signal exists, varies, and is currently discarded.

## What a score is allowed to claim

Lighthouse is the useful precedent because its model is public: the SEO category is about 14
automated audits, each **binary**, each **weighted equally** except the manual structured-data
check, so the category score is the share that passed — 13 of 14 reads as 92. Bands are 0–49
poor, 50–89 average, 90–100 good. `[industry, from Lighthouse's own scoring docs]`

Lighthouse also declines to judge quality: its meta-description audit checks presence and
non-emptiness, and nothing about whether the description is any good. `[official — Chrome
documentation]`

So the honest claim available to a share-of-passed score is: *this page has no obvious technical
defects*. It is not a prediction of traffic, a competitive comparison, or a quality judgement.
Anything stronger needs query data, which HTML does not contain — see
[`keywords-and-intent.md`](keywords-and-intent.md).

## Open questions this raises

- Should severity bands (`error` / `warning` / `notice`) or a flat share drive any future score —
  and what does the denominator mean when a rule cannot apply to a page (a canonical mismatch on a
  page with no canonical)?
- Should length rules report a measured value and a reference range rather than a pass/fail, given
  how often Google overrides both title and description?
- Is a crawler-side TTFB worth reporting at all once its dependence on the crawler's location is
  understood, and is there an honest way to label it?

## Sources

Official:
- [Lighthouse SEO audits — Chrome for Developers](https://developer.chrome.com/docs/lighthouse/seo/)
- [Control your snippets in search results](https://developers.google.com/search/docs/advanced/appearance/snippet)
- [Search Quality Rater Guidelines (PDF, 11 Sep 2025)](https://guidelines.raterhub.com/searchqualityevaluatorguidelines.pdf)

Industry:
- [Lighthouse scoring docs](https://github.com/GoogleChrome/lighthouse/blob/26a0ee6f410bae57eaa5f8ded17ef1741e4adbd5/docs/scoring.md)
- [Lighthouse SEO score — DebugBear](https://debugbear.com/blog/lighthouse-seo-score)
- [Core Web Vitals metrics and thresholds — DebugBear](https://www.debugbear.com/docs/core-web-vitals-metrics)
- [Why Google replaces meta descriptions](https://ideadigital.agency/en/blog/pwhy-google-replaces-meta-descriptions-and-when-we-lose-control-over-themp/)
- [Title tag and meta description best practices](https://www.thestackanalyst.com/title-tag-meta-description-best-practices/)
- [Quality rater guidelines: crib notes to E-E-A-T](https://ipullrank.com/quality-rater-guideline-crib-notes-e-a-t)
- [Google quality raters now assess whether content is AI-generated](https://searchengineland.com/google-quality-raters-content-ai-generated-454161)
- [Article schema markup guide](https://dev.to/forze-dev/article-schema-markup-the-complete-guide-to-structured-data-for-blog-posts-and-articles-2e6o)
- [Structured data SEO 2026: rich results guide](https://www.digitalapplied.com/blog/structured-data-seo-2026-rich-results-guide)
