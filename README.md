# SEO Keyword Tracker

An agency tool: add a client's website, and it finds the blog, crawls the first 15 posts,
works out which keywords each post targets, flags its SEO issues, and tracks the posts'
Google positions over time. Each user sees only their own clients.

## Run it from a clean clone

Requirements: Docker with Compose v2. Ports 8080 (app) and 55433 (Postgres) must be free.

```bash
git clone https://github.com/trino27/keyword-tracker.git seo-keyword-tracker
cd seo-keyword-tracker
cp .env.example .env
docker compose up -d --build
docker compose run --rm seed
```

Open http://localhost:8080 and sign in as **`semrush.manager@example.com`** or
**`yoast.manager@example.com`**, password `demo-password-change-me` (the demo value of
`SEED_USER_PASSWORD` in `.env`). The seed crawls both live sites (about a minute) and writes a
year of daily positions — about 56 000 snapshots. It is idempotent: run it again any time; it
crawls nothing twice and fills positions up to today, including for clients added in the UI.

## Local development

Node 24 and pnpm 10, with Postgres in Docker and the two apps on the host. The same
`cp .env.example .env` as above; nothing else is configured.

```bash
pnpm install
pnpm dev:db                  # Postgres only, on 55433
pnpm db:migrate
pnpm dev:be                  # API on :3000
pnpm dev:fe                  # SPA on :5173, proxying /api to :3000
pnpm seed                    # the same demo data, against the local database

pnpm lint && pnpm typecheck && pnpm test   # what pre-push and CI run
pnpm test:db                 # the integration and e2e suites, against pnpm dev:db
```

## Decisions, and why

- **React + Vite, a statically served SPA.** An internal tool has nothing to index, so there is
  no SSR and no render tier. Wire types, the check catalogue and the score formula live in
  `@app/contracts` — one copy, not two that drift.
- **Finding the blog without knowing the site.** Sitemaps come from robots.txt or the usual
  addresses; a candidate group scores on its name, the share of its URLs in a blog path, and the
  share of the site's RSS feed it covers — the strongest signal, because a feed lists posts and
  nothing else. With no blog sitemap at all the feed itself is the source, and failing that the
  site's listing pages are read. Neither seed site is special-cased.
- **Keywords come from the whole crawl, not one page** — a subject can only be told from the
  site's vocabulary by comparing pages. Phrases score on the fields they appear in, pay a corpus
  penalty that strips what every page says, then compete for a budget of 2–6 slots. A title is
  tokenized into every window it contains, so a phrase the prose never repeats is damped and a
  bare common word is not selected at all — otherwise a page is filed under `nlds thriller` or
  `exercises` while its subject sits one line below.
- **The checks are not invented here:** 44 checks, one unit per catalogued code, from Google's
  SEO Starter Guide, Search Central's crawling and indexing guides and the set Lighthouse audits.
  Every check explains itself at length and links the documentation behind it, and every finding
  quotes the markup, header or robots.txt rule that proves it. Forty judge a page by
  itself and four compare it with the rest of the crawl; which of the two a check is follows
  from its catalogue entry, so the wrong shape does not compile. Each answers pass, fail or *not
  applicable*; a page's score is the share of the checks that could apply to it, equally weighted
  — weighting by severity would invent a ranking model nobody can justify.
- **Positions are computed at read time** (`LATERAL … LIMIT 1` on the snapshot primary key),
  never stored as columns that must then be kept true to the history. A snapshot hangs off a
  page-and-keyword pair by a composite key, so it cannot exist for a keyword the page lacks.
- **The crawl is a Postgres queue** on `crawl_runs` (`SKIP LOCKED`, leases, an attempt fence,
  `LISTEN/NOTIFY`): adding a client answers at once and no broker is deployed. A re-crawl deletes
  nothing — pages it no longer finds keep their history.
- **Time:** every instant is `timestamptz` in UTC and the user's zone is a column; the API turns a
  calendar range into UTC bounds in that zone, across DST, and the UI formats in it.
- **Isolation:** every query is scoped by the session's user in the query itself, and a foreign id
  answers exactly like a missing one — an e2e matrix proves it per route. Sessions are server-side
  opaque cookies, passwords scrypt; outbound HTTP refuses private and loopback addresses.

Every weight and threshold, and what each was measured against: [`docs/decisions.md`](docs/decisions.md).

## Not done, and next

- **External signals instead of the system's own guesses:** Search Console, and the volume and
  difficulty data Semrush or Ahrefs carry. Positions are simulated, and a keyword's worth is
  judged from the page's text alone.
- **A language model in the keyword step.** Counting fields and surface forms cannot tell that
  "rank tracking" and "position monitoring" are one subject, or whether a phrase is something a
  person types into Google. Embeddings fold the paraphrases together; a model asked for the
  queries a page targets reads it as a person does. It would re-rank what this extractor
  generates, never replace it — a crawl must still answer when the model is away.
- **Co-occurrence, before reaching for a model.** The paraphrase problem above needs embeddings;
  a weaker and cheaper reading does not. TextRank ranks a term by how connected it is to the
  terms it is written beside, evidence the field weights cannot see at all — and the runs
  `tokenize` already produces are the windows it needs, so it asks nothing of a language. Worth
  having as a second opinion against the fixture catalogue; worth adopting only where it
  disagrees with the current ranking and is right.
- **Intent, which the catalogue has no word for.** "How to track rankings" and "rank tracking
  tool pricing" are one subject and two different jobs, and an agency acts on the difference —
  one gets a guide, the other a landing page. The signal is in hand and thrown away: `vs`,
  `versus`, `why`, `when` and the rest are stop words precisely because they cannot bound a
  phrase, so the words that say what the searcher wants are the ones extraction discards. A
  label on a keyword already found, not a second extraction.
- **Language as a configurable abstraction** — stop words, stemmer and weights per site rather
  than compiled in; today an inflected language counts one word as several.
- **The zones the parser reads and the scoring ignores.** `alt` text and `og:title` are extracted
  — one for IMAGES_MISSING_ALT, one for OG_TAGS_MISSING — and never scored, though an author
  writes both out of the subject the way they write the slug. Each is a field weight and a line
  in `collect-candidates` and no more than that, which is also the reason to measure before
  believing it: a decorative alt is noise at whatever weight it is given.
- **Tuning the hyperparameters**, set by hand against two sites, on a labelled corpus against a
  measurable outcome.
- **The site-level checks still missing** — orphan pages and a sitemap that disagrees with what
  the crawl found. Both need a crawler that FOLLOWS LINKS; this one visits the URLs a sitemap
  lists, so "nothing links here" is a conclusion from evidence it never gathered. Outgoing
  internal links ship as `NO_INTERNAL_LINKS`, which one page can answer about itself; duplicate
  titles, duplicate descriptions and cannibalisation ship as the three run-scoped codes. Then
  the network ones (Lighthouse, Core Web Vitals), and more crawl parallelism, which
  `SKIP LOCKED` already leaves as only a second worker process away.
- **Keyword stuffing, the one spam rule the catalogue is missing — measured, not guessed.**
  Google's spam policies name it and publish no number. The comparative form was built (three
  times the site's median density of its top keyword) and fired on four ordinary posts on the
  recorded corpus, "google analytics" at 3.5% in a post about Google Analytics among them; per
  paragraph, a yoast product paragraph is denser than Google's own example. No line separates
  those without inventing one. `PAGE_ANALYSIS_MODULE.md` keeps the numbers.
- **A ranked impact weight per check.** Today every check counts the same in the score, and
  deliberately so: weighting by severity would invent a ranking model nobody can justify. The
  honest version of that weight is measured, not asserted — the checks regressed against
  observed position movement, or impact data published by a source that has it. It costs more
  than a constant: weights break the comparability the equal denominator gives (100 out of 22
  applicable checks and 100 out of 44 are already different claims), the stored
  `checks_applicable = cardinality(checks_judged)` would have to become a weight sum, and a
  score whose weights moved is not the score crawled last month. Until the evidence exists,
  equal weight is the claim the data supports.

## AI tools used

Claude Code (Anthropic) throughout: interviewing the requirements into a plan and OpenSpec
changes, test-first implementation phase by phase, and review. The plans are in
`docs/_plans-archive/`, the thirteen changes they drove in `openspec/changes/archive/`.

`be/` NestJS API · `fe/` React + Vite SPA · `packages/contracts/` what both sides share ·
`caddy/` web server · `openspec/` requirements · `AGENTS.md` entry point for contributors.
