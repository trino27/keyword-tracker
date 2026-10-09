# Decisions, in full

The README keeps these to one page, as the brief asks. This is the long form: every
weight, threshold and trade-off, and what each was measured against.

## How it was built

**React + Vite, a statically served SPA.** This is an agency's internal tool, not a storefront:
it has no SEO of its own and nothing to index, so it needs no SSR, no Next, no Node process
rendering HTML in production — Caddy serves the built bundle and proxies `/api`. One static
server instead of a render tier to scale and keep alive. State lives in zustand ViewModels
behind gateway classes, and types and rules are shared with the API through `@app/contracts`,
so the score formula and the check catalogue exist once rather than as two copies that drift.

**Finding the blog without knowing the site.** Sitemaps come from robots.txt, otherwise from the
usual addresses; the walk is bounded at depth 3 and 50 fetches. Numbered siblings
(`post-sitemap2.xml`) are read as one sitemap. Each group scores on three terms: its name
(`blog`/`blogs` +3, `post`/`article` +2, `news` +1; any non-blog token — `product`, `tag`,
`author`, `category`, … — costs 3; a `blog.` host is +3 on its own; a Google News sitemap +2),
the share of its URLs in a blog section of the path (weight 3), and the share of the site's RSS
feed it covers (weight 4 — the strongest signal, because a feed lists posts and nothing else).
Highest score wins, then more URLs. Below 2 no candidate looks like a blog; the best of the rest
is taken unconfirmed, and then a page counts as a post only when it says it is an article. With
no blog sitemap at all, the usual listings (`/blog/`, `/news/`, …) are read and their links one
level down become the candidates — minus pagination, tags, authors and search. semrush.com and
yoast.com are not special-cased anywhere; fixtures recorded from both pin the result.

**"The first 15 posts in sitemap order"** skips entries that are not posts, and says so: Yoast's
first entry, `/seo-blog/`, declares itself a listing (JSON-LD `CollectionPage`). Every entry
considered, crawled or not, is in the run log with its reason.

**Keyword extraction** runs over the whole crawl rather than one page, because a site's
vocabulary can only be told from a page's subject by comparing pages with each other.

1. *Before anything is counted.* Title tail segments that most of the run repeats, or that name
   the brand, are stripped ("How to X | Yoast"). Declared keywords most of the run also declares
   are the CMS taxonomy, not the topic, and earn no bonus. A short fragment one page repeats
   three or more times (`Quick action:` before twenty paragraphs) is its furniture, not its prose.
2. *Candidates.* Text is normalized and tokenized; stop words come from `<html lang>` (41
   languages, the English list extended with what web prose is full of and it lacks). N-grams up
   to five words — shorter and a real query breaks into windows of itself; with no declared
   language the limit is two, because without stop words trigrams are noise. The slug is read as
   words only when it is words, not a hash or percent-encoded bytes.
3. *Score on its own page.* The weights of the fields the phrase appears in: title 5, h1 4, slug
   3, meta 2, subheading 2, first paragraph 1.5. The body is the only field scored by frequency,
   `2.5 × ln(1 + occurrences)`, so ten mentions in the text weigh about as much as one in the
   title. Then a bonus for appearing in several deliberate fields at once (+25% per field past
   the first), +15% for the page's own declared keyword, and a factor for phrase length: a bare
   word is damped (0.6), two and three words preferred (1.15), five damped again (0.85). A phrase
   no title, h1 or slug names, said once in the text, scores zero — it is prose, not a subject.
   The converse too: a title is tokenized into every window it contains, and a window the prose
   never repeats keeps half its score, or "Brewers stadium roof saves Milwaukee vs Padres in NLDS
   thriller" scores seven fragments alike and subsumption files the game report under `padres in
   nlds thriller`. The page's own named head clause is exempt — that one is the declaration.
4. *The corpus penalty.* `ln(1 + N/df) / ln(1 + N)`: a term on all 15 pages keeps a quarter of
   its score, because it is the site's name or its product. A term the page names in its own
   title, h1 or slug pays half the penalty — but only while it belongs to one section rather than
   the whole site (up to 15% of the run). Otherwise `google analytics` would be the keyword of
   the dashboards post and the conversions post alike.
5. *Selection.* A short candidate gives way to a longer one that contains it and scores at least
   half as well — but no more than two tokens longer, or a whole headline swallows the subject.
   Two selected keywords may not share more than half of the shorter one's content words, which
   catches the windows of one sentence that containment cannot see; and one sentence yields at
   most two keywords. A single word is selected only when the page's prose writes it as a name:
   damping is enough while a bare word competes and not enough when it wins, because relevance is
   a share of the top — "3 exercises to have more fun with Google Analytics" was filed under
   `exercises`. A page's budget is 2 slots plus one per 400 words, capped at 6: a short post may
   not claim eight subjects. Nothing below 20% of the top score is added at all — one honest
   keyword beats five invented ones.

**The checks.** The catalogue is not invented here. Titles, meta descriptions, headings, alt
text, `lang` and thin content are what Google's own
[SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
asks of a page; the rest follows Google Search Central on
[canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[`noindex`](https://developers.google.com/search/docs/crawling-indexing/block-indexing) and
[structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data),
and the set as a whole is the one
[Lighthouse audits under SEO](https://developer.chrome.com/docs/lighthouse/seo/), with
[robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro),
[crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
and [redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects) from
Google's crawling guides. Each check explains itself and cites its source in the catalogue, and
each finding quotes the evidence it found. 39 checks,
exactly one unit per catalogued code: a code without a check does not compile, and neither does a
check registered under another code or given a shape its catalogue scope does not call for. A check
answers `pass`, `fails` or `notApplicable`; the third outcome exists because without it "the title
is 45 characters" and "there is no title to measure" looked the same, and a page with no title was
silently rewarded for a check that never ran. Severity is not the check's — it comes from the
catalogue, and the lists of measured and conditional codes are derived from the
catalogue by type rather than kept beside it. One pass produces the issues, both counts behind
the score, and the record of which codes were judged and which were not — the only account there
will ever be of how the catalogue looked at that crawl.

**A page's score is the share of the checks that could apply to it.** Nineteen of the thirty-nine
are conditional — a page with no images is not judged on alt text, a page with no description is
not judged on its length — so the denominator is counted at crawl time, while the parsed page is
still in hand, and shown beside the number: 100 out of 20 and 100 out of 39 are not the same
claim. Every check weighs the same; weighting by severity would invent a model of ranking nobody
can justify, and Lighthouse does the same and says so — "each SEO audit is weighted equally in
the Lighthouse SEO Score"
([Lighthouse SEO audits](https://developer.chrome.com/docs/lighthouse/seo/)). The formula lives
in the shared package and is computed identically on both sides. What the number may mean: this
page has no obvious technical defects. Not a traffic prediction, not a judgement of the writing.

**The detail names every check and what it concluded** — passed, failed, not applicable, or
added to the catalogue after this page's last crawl — so the denominator is readable as a list
and not only as a number. A check that could not run is listed with its reason ("the page has no
images") rather than counted as a pass, and the page says how its own score was reached: the
arithmetic, the equal weighting, and what the number is not allowed to claim. Which checks ran is
recorded at crawl time in two columns beside the counters, because the stored row holds no
canonical, no images and no headings and cannot answer it afterwards.

**The pages list is ordered worst first**, interleaving clients rather than grouping by name.
The score exists so a portfolio can be triaged, and an order that buries the worst page of the
second client under the best page of the first defeats it. The sort ends in a unique key, so a
page appears on exactly one page of the list.

**The crawl is a Postgres queue** on `crawl_runs` (`FOR UPDATE SKIP LOCKED`, leases, an attempt
fence, `LISTEN/NOTIFY` wake-ups): adding a client answers at once, a worker does the run, and no
broker is deployed for it.

**Best and latest positions are computed at read time** (a `LATERAL … LIMIT 1` on the snapshot
primary key — 0.8 ms for a 15-page slice, plan checked with `EXPLAIN`), never stored as columns
that then have to be kept true to the history.

**A position snapshot belongs to a page-and-keyword pair** by a composite foreign key — it cannot
exist for a keyword the page does not have.

**Time:** every instant is `timestamptz` in UTC and the user's zone is a column
(`users.time_zone`). The API turns a calendar range into UTC bounds in that zone
(`[from 00:00, to+1 00:00)`, right across DST) and the UI formats in it — never the browser's.

**Isolation:** every query is scoped by the session's user in the query itself; a foreign id
answers exactly like a missing one (404, same body); every route is signed-in by default. An e2e
matrix proves it per route, and a static test fails if a new id-taking route is missing from it.
Sessions are server-side (an opaque cookie, its SHA-256 in Postgres), passwords scrypt.

**A re-crawl deletes nothing.** Pages and keyword pairs a newer crawl no longer finds keep their
history and are hidden; issues describe the latest fetch only.

**Outbound HTTP is guarded:** private, loopback and metadata addresses are refused at connect
time (no DNS-rebinding window), with size caps, timeouts and bounded retries.

## Not done, and next

- External signals instead of the system's own guesses: Google Search Console (real impressions,
  clicks and positions) and the volume and difficulty data the services this kind of tool is built
  on provide — Semrush, Ahrefs, DataForSEO. Positions are simulated today, and a keyword's worth
  is judged from the page's text alone; those sources carry what no HTML contains — demand,
  competition, and the actual result page.
- A language model in the keyword step. Everything here counts: which fields a phrase appears in,
  how often, how many pages of the run repeat it. Counting cannot tell that "rank tracking" and
  "position monitoring" are one subject, that "how do I speed up my site" is a query and "the
  following section" is not, or that a page about migrations mentions redirects without being
  about them. An embedding model answers the first two — paraphrases fold together, and a
  candidate can be scored against the page's own topic rather than against its own frequency —
  and a model asked outright for the queries a page targets reads it the way the person writing
  the brief would.

  It would re-rank and fold what this extractor generates rather than replace it, for three
  reasons. A crawl must still answer when the model is unavailable or the key is unpaid, and a
  deterministic generator is what makes that fallback honest rather than empty. The candidates
  are already the page's own phrases, so the model is never free to invent a keyword the page
  does not contain — the failure mode that matters most here. And the tests pin exact terms per
  fixture; a step whose output moves between runs needs its own kind of assertion, which is work
  in itself. The pipeline takes it without rewriting either neighbour: a keyword step is an
  interface and the order of the steps is data, so a re-ranking one sits between `score` and
  `select` the way the stemming step for inflected languages is meant to sit between `collect`
  and `frequency` — one entry in an array, which is what makes the experiment revertible.
- Language as a configurable abstraction: a language profile — stop words, stemmer, phrase length,
  thresholds and weights — attached per client site rather than compiled in. Today the language
  specifics are spread across constants and one stop-word list, and each new language means
  editing code.
- Keyword extraction matches surface forms, so in an inflected language one word counts as several
  and each form ranks lower than the word deserves. The forms need folding together when
  candidates are counted — while the reader still sees the form the page used.
- Tuning the hyperparameters. Every weight and threshold in keyword extraction and blog discovery
  was set by hand against two sites and recorded fixtures; they want fitting on a larger labelled
  corpus, and against a measurable outcome — impressions and clicks per keyword.

  The keyword half now has the corpus, if not the outcome: `be/src/modules/page-analysis/
  _catalogue/` labels every keyword the 41 recorded pages produce and asserts the counts, and
  `runArm` moves one constant across the whole catalogue at a time. Sweeping them is what
  established that none of them is the lever: the good long tail and the junk occupy the same
  band of relevance — `schema markup` at 0.30 against `every dollar` at 0.26 — so a threshold
  that removes one removes the other, and the separation that worked was grammatical rather than
  numeric. A larger corpus would move this; real impressions per keyword would settle it.
- More checks and metrics. Duplicate titles, duplicate descriptions and cannibalisation now ship
  as the three run-scoped codes, and outgoing internal links as `NO_INTERNAL_LINKS`. What is left
  is the network ones (Lighthouse, Core Web Vitals, broken links), content freshness, and orphan
  pages — which need a crawler that follows links, where this one visits the URLs a sitemap
  lists, so "nothing links here" is a conclusion from evidence it never gathered.
- More parallelism in the crawl. Three fetches at a time in fixed windows, two runs per worker:
  a slow page holds its window, and a big client waits behind another. A per-host sliding window
  and more worker slots would cut a run to a fraction of its time, and the queue already
  supports it — `SKIP LOCKED` means another process is the only thing to add.
