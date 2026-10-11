# Frontend skills

What is true of THIS frontend (`fe/`, a React + Vite MVVM single-page app) and would be wrong to
hand to another app. Portable React rules live in
[`practices/fe/AGENTS.md`](../../practices/fe/AGENTS.md); when a rule there and a rule here
disagree, the workspace skill wins.

| skill | decides | read when |
| --- | --- | --- |
| [`folder-structure/`](folder-structure/SKILL.md) | where every file under `fe/src/` goes: the layer folders, the transport and base gateway, ViewModels and their services, screens, naming | before creating or moving any file |
| [`data-retrieval/`](data-retrieval/SKILL.md) | how a screen gets data: the ViewModel action, `status`, in-flight sharing, superseded answers, refresh after a write | before adding a screen that loads data, a filter, or a write that changes a list |
| [`error-display/`](error-display/SKILL.md) | where each failure is shown (page, section, field) and why a failed read and a refused write are two fields | before adding a screen, a form or a write action |
| [`testing/`](testing/SKILL.md) | this app's test setup: jsdom, the Toronto timezone, gateway-prototype spies, store reset, placement | before writing or placing a test |

For anything else, start at [`practices/fe/AGENTS.md`](../../practices/fe/AGENTS.md): layers,
ViewModels, gateways, routing and guards, forms, error handling and path aliases are written there
for this stack and not restated here.

## Screen behaviour that is specified, not merely implemented

`fe/` keeps skills rather than module documents, so the deposits for frontend requirements live
here rather than in a document created to hold them.

<!-- invariant: PAGEDETAIL-009 -->
**The page detail lists every catalogue check with its outcome, and names the reason a skipped
one was skipped.** The screen never derives a status: it renders what the backend composed, in
the order given. Pinned by `fe/src/Modules/PageDetail/ChecksSection/ChecksSection.test.tsx` and
`fe/src/ViewModels/PageDetailViewModel/Services/SummariseChecks/summariseChecks.test.ts`.
Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-010 -->
**The score is explained on the page's own numbers, and bounded in what it claims.** The
arithmetic shown must round to the score shown beside it, and the band thresholds come from
`SCORE_BANDS` rather than retyped prose. Pinned by
`fe/src/ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore.test.ts` ->
"never prints a quotient that rounds away from the score", and by
`fe/src/Modules/PageDetail/ScoreExplainer/ScoreExplainer.test.tsx`.
Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

Deposited after archive (`openspec/README.md` §4 and §8). Paths are relative to `fe/src/`.
Where a requirement is not pinned, that is said in words rather than left silent.

<!-- invariant: TZ-004 -->
**Every instant is formatted with `Intl` in the session user’s zone, and the range presets are computed from today in that zone.** Pinned by `Core/Helpers/FormatInZone/formatInZone.test.ts` -> "formats in the given zone, not the machine’s"; `ViewModels/PageDetailViewModel/Services/ResolveRange/resolveRange.test.ts` -> "a Tokyo user is already a day ahead". NOT pinned by a lint rule — a component formatting without a zone would pass lint. Specified in `openspec/specs/_root/time-zones/spec.md`.

<!-- invariant: SHELL-001 -->
**Every screen sits behind the session guard, and sign-in returns the user only to a same-origin path.** Pinned by `App/Router/router.test.tsx` -> "a signed-out visit to /pages lands on sign-in, carrying where it was going"; `Core/Helpers/SafeRedirectPath/safeRedirectPath.test.ts` -> the "drops %j" cases, including `//evil.example` and `/\evil.example`. Specified in `openspec/specs/fe/src/App/spec.md`.

<!-- invariant: SHELL-002 -->
**A 401 from any call but sign-in and the session probe signs the user out once, in one place.** Pinned by `ViewModels/SessionViewModel/SessionViewModel.test.ts` -> "a 401 elsewhere signs the user out and calls the router back"; `Gateways/_Shared/ABaseGateway/ABaseGateway.test.ts` -> "announces a 401 as an expired session, then throws it". Specified in `openspec/specs/fe/src/App/spec.md`.

<!-- invariant: SHELL-003 -->
**Sign-out ends the server session and resets every ViewModel, stopping its polling timers.** Pinned by `ViewModels/SessionViewModel/SessionViewModel.test.ts` -> "signing out clears every registered user store"; the timers indirectly, by each store’s own "stopPolling stops it". No test asserts the two together. Specified in `openspec/specs/fe/src/App/spec.md`.

<!-- invariant: SHELL-004 -->
**One shell for every screen — Pages, Issues, Clients, Info — one colour per crawl status, and one name and colour per severity (Critical, Important, Improvement), each over its whole set.** Pinned by `pnpm --filter fe typecheck`: `crawlStatusColor` is a `Record<TCrawlRunStatus, …>` and `Core/Constants/severityLabel.ts` a `Record<TSeoIssueSeverity, { label; color }>`, so a new status or severity without its entry does not compile; `Modules/PageDetail/IssuesSection/IssuesSection.test.tsx` -> "groups by severity, worst first, with the sentence and the fix" reads the new names. That the navigation reopens Pages and Issues as they were left is pinned by `ViewModels/ScreenFiltersViewModel/ScreenFiltersViewModel.test.ts` -> "remembers each screen's last search", "reopens the report as it was left", "carries the pages list's client into a report never opened", "restores nothing before either screen was opened, and forgets on reset"; `Modules/Issues/IssuesScreen.test.tsx` -> "keeps the chosen filters when the reader leaves for Pages and comes back". The navigation's order is pinned by `Modules/_Shared/AppLayout/AppLayout.test.tsx` -> "offers Info as the fourth tab, opening the guide"; the rest of the shell is NOT pinned — `PageHeader/` and `CrawlStatusBadge/` have no test. Specified in `openspec/specs/fe/src/App/spec.md`.

<!-- invariant: GATEWAY-001 -->
**Every gateway response is parsed against a zod schema typed as the contract shape; a wrong shape is refused rather than rendered.** Pinned by `Gateways/_Shared/ABaseGateway/ABaseGateway.test.ts` -> "rejects a response the schema does not describe"; `Gateways/PageGateway/PageGateway.test.ts` -> "rejects an issue code the catalogue does not have"; `Gateways/PageGateway/Validation/PageSchemas.test.ts`. The `z.ZodType<contract>` half is typecheck. Specified in `openspec/specs/fe/src/Gateways/spec.md`.

<!-- invariant: CLIENTSUI-001 -->
**The add form puts a refusal under the field it belongs to and keeps what was typed.** Pinned by `Modules/Clients/AddClientForm/AddClientForm.test.tsx` -> "an already-tracked site links to that client’s pages" and "refuses a local address before sending"; `ViewModels/ClientsViewModel/ClientsViewModel.test.ts` -> "a network failure on add is a form-level error". The ignored double submit is NOT pinned. Specified in `openspec/specs/fe/src/Modules/Clients/spec.md`.

<!-- invariant: CLIENTSUI-002 -->
**A successful add lands on the new client’s filtered pages list, where the banner follows its crawl.** Pinned by `AddClientForm.test.tsx` -> "hands over the new client’s id"; `Modules/Pages/CrawlBanner/CrawlBanner.test.tsx` -> "follows a running crawl". The navigation itself is NOT pinned — `ClientsScreen.tsx` has no test. Specified in `openspec/specs/fe/src/Modules/Clients/spec.md`.

<!-- invariant: CLIENTSUI-003 -->
**The clients table polls every two seconds while any run is active, and stops by itself when none is.** Pinned by `ClientsViewModel.test.ts` -> "polls only while a run is active, and stops by itself"; `ViewModels/ClientsViewModel/Services/HasActiveRun/hasActiveRun.test.ts` -> "is true while any run is queued or running". Specified in `openspec/specs/fe/src/Modules/Clients/spec.md`.

<!-- invariant: CLIENTSUI-004 -->
**Re-crawl is disabled while a run is active, and a racing refusal is shown on that row without hiding the table.** Pinned by `Modules/Clients/ClientsTable/ClientsTable.test.tsx` -> "disables re-crawl while a crawl runs, and links each client to its pages"; `ClientsViewModel.test.ts` -> "a refused re-crawl is shown on its row". Specified in `openspec/specs/fe/src/Modules/Clients/spec.md`.

<!-- invariant: CLIENTSUI-005 -->
**The run log shows the selected sitemap and every candidate in sitemap order with its status and reason.** Pinned by `Modules/Clients/RunLog/RunLog.test.tsx` -> "lists every considered entry in sitemap order with its result and reason". The selection REASON sentence itself is not asserted. Specified in `openspec/specs/fe/src/Modules/Clients/spec.md`.

<!-- invariant: CLIENTSUI-006 -->
**Each client row offers View issues, opening `/issues?clientId=<id>`.** Pinned by `Modules/Clients/ClientsTable/ClientsTable.test.tsx` -> "disables re-crawl while a crawl runs, and links each client to its pages", which also expects the View issues link. Specified in `openspec/specs/fe/src/Modules/Clients/spec.md`.

<!-- invariant: PAGELIST-001 -->
**Filter, search, page and page size live in the URL with defaults, and the search is debounced.** Pinned by `App/Router/SearchSchemas/PagesSearchSchema/pagesSearchSchema.test.ts` -> "defaults to the first page of 20" and "falls back on malformed values instead of failing"; `Modules/Pages/PagesFilterBar/PagesFilterBar.test.tsx` -> "writes the search once, after the user pauses". The return-to-page-1 rule is NOT pinned — `PagesScreen.tsx` has no test. Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-002 -->
**Each row shows its title, keywords, best position, issue count and last capture, and opens the detail.** Pinned by `Modules/Pages/PagesTable/PagesTable.test.tsx` -> "a page without positions shows — and links to its detail"; `Core/Helpers/PositionBucket/positionBucket.test.ts`; `Core/Helpers/FormatInZone/formatInZone.test.ts`. The pagination controls are NOT pinned — `PagesPagination/` has no test. Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-003 -->
**An empty list distinguishes a user with no clients from filters that match nothing.** Pinned by `PagesTable.test.tsx` -> "offers to add a client when there are none, and to clear a fruitless search"; `ViewModels/PagesViewModel/Services/ToEmptyKind/toEmptyKind.test.ts` -> "tells the four empty lists apart". Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-004 -->
**A crawl banner polls the filtered client’s run, stops at a terminal status and reloads the list once.** Pinned by `CrawlBanner.test.tsx` -> "follows a running crawl", "explains a partial crawl and points to its log", "says nothing once the crawl succeeded"; `ViewModels/CrawlStatusViewModel/CrawlStatusViewModel.test.ts` -> "polls while the run is active and counts the finish it saw". Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-005 -->
**The header summarises the portfolio in words, with Add client and per-client status badges.** Pinned by `ViewModels/ClientsViewModel/Services/SummarizeClients/summarizeClients.test.ts` -> "counts pages and clients in words". The action and the badges are NOT pinned — `PagesScreen.tsx` has no test. Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-006 -->
**The row leads with the score in its band and its fraction, in the order the API returned, never re-sorted.** Pinned by `PagesTable.test.tsx` -> "a page failing 10 of 18 checks renders 44 in the poor band, with its denominator" and "the first row is the lowest score the gateway returned"; `Modules/_Shared/ScoreBadge/ScoreBadge.test.tsx`. Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-007 -->
**The issues cell says how many findings other pages of the client share, and nothing when that is none.** Pinned by `PagesTable.test.tsx` -> "a row with two shared findings reads '2 site-wide'" and "a row sharing nothing shows only the severity badges". Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-008 -->
**Each row shows LCP · INP · CLS as badges coloured by band beside the score, with value, source and date in the tooltip, and says in words when a page is measuring, paused, failed, unmeasured or PageSpeed is not configured.** Pinned by `Modules/Pages/PagesTable/CwvBadges/CwvBadges.test.tsx` -> "colours each metric by its band, and grey for no data", "says in the tooltip the value, the band, whose it is and when", "reads Measuring… while queued", "a queued row reads Paused under keyRejected", "reads Not measured for a page never queued", "reads Couldn't measure for a page given up on", "keeps an old measurement and flags that the refresh failed", "is a dash without a key"; `PagesTable.test.tsx` -> "the header says PageSpeed is not configured, and the cells are dashes", "the header says the key was rejected, and stored badges stay", "explains the colours under the table"; `Core/Helpers/DescribePageSpeed/describePageSpeed.test.ts` and `Core/Helpers/DescribeCwv/describeCwv.test.ts`. Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGELIST-009 -->
**A row's issue count opens the report filtered to that page, with every level shown — a row of Improvements never opens on an empty report — without taking over the row's link to the detail.** Pinned by `PagesTable.test.tsx` -> "links a row's issue count to the report, filtered to the page", which expects `levels` to name all three. Specified in `openspec/specs/fe/src/Modules/Pages/spec.md`.

<!-- invariant: PAGEDETAIL-001 -->
**The detail opens with a breadcrumb restoring the list’s search, a header and the KPI cards.** Pinned by NOT pinned by a test — `PageDetailScreen.tsx`, `PageDetailHeader/` and `KpiCards/` have no test, so neither the breadcrumb’s restoration of the list’s search nor the cards are asserted anywhere. Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-002 -->
**The history range is computed as calendar days in the user’s zone and kept in the URL, the last change winning.** Pinned by `App/Router/SearchSchemas/PageDetailSearchSchema/pageDetailSearchSchema.test.ts` -> "defaults to the last 30 days as a chart"; `Services/ResolveRange/resolveRange.test.ts`; `PageDetailViewModel.test.ts` -> "when the range changes twice, only the last answer is kept". Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-003 -->
**The chart puts position 1 on top, one line per visible keyword, with the chips as its legend; the title names the positions' source.** Pinned by `PositionHistory/PositionHistory.test.tsx` -> "names where the positions come from beside its title"; `PositionHistory/KeywordToggles/KeywordToggles.test.tsx` -> "toggles a keyword and strikes through one without points"; `Services/ToChartRows/toChartRows.test.ts` -> "pivots series into day rows, on the user’s calendar". The inverted axis is NOT pinned — `PositionChart/` has no test. Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-004 -->
**The table gives each keyword its latest, its change with direction, and its best and worst over the range.** Pinned by `PositionHistory/PositionTable/PositionTable.test.tsx` -> "shows latest, change as places gained, best and worst per keyword"; `Services/BuildHistoryTable/buildHistoryTable.test.ts` -> "a falling keyword has a negative change" and "a keyword without points keeps its row, empty". Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-005 -->
**Issues are grouped Critical / Important / Improvement and read their numbers from the measurement the crawl stored, not from today’s catalogue.** Pinned by `IssuesSection/IssuesSection.test.tsx` -> "groups by severity, worst first, with the sentence and the fix", which expects the headings Critical and Important; `Services/GroupIssues/groupIssues.test.ts` -> "reads a measured sentence from the bounds the crawl stored, not from today’s catalogue". Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-006 -->
**The crawl’s response time is shown as one fetch by our crawler — never as an issue, never as a score input.** Pinned by NOT pinned on the frontend — the wording lives in `PageDetailHeader.tsx`, which has no test. The value’s presence and the absence of a timing issue are pinned backend-side by `be/test/e2e/pages.e2e-spec.ts`. Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-007 -->
**The detail shows the score as a banded card with the applicable-check count it came from.** Pinned by `Modules/_Shared/ScoreBadge/ScoreBadge.test.tsx` -> "names the denominator it was computed from" and the band cases. Its placement as a KPI card is NOT pinned — `KpiCards/` has no test. Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-008 -->
**A finding on several of the client’s pages says how many; a finding on this page alone says nothing extra.** Pinned by `IssuesSection/IssuesSection.test.tsx` -> "an issue on five of fifteen pages reads 'on 5 of 15 pages'" and "an issue on one page says nothing extra". Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-011 -->
**The page's Speed block shows each metric's value, band, source and date, the lab score as a caption, and every state in words — measuring, could not refresh, could not measure, not measured, not configured, key rejected.** Pinned by `Modules/PageDetail/SpeedSection/SpeedSection.test.tsx` -> "shows each metric's value, band and source", "a lab value says it may vary", "INP without data says why", "shows the lab performance score as a caption", "says a queued page is being measured", "under keyRejected the block opens with the key-rejected notice", "says PageSpeed is not configured without a key", "says why a page could not be measured", "keeps the old figures when a refresh failed, and says so". Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: PAGEDETAIL-012 -->
**The score's explanation says speed is scored separately, and its arithmetic is unchanged.** Pinned by `ViewModels/PageDetailViewModel/Services/ExplainScore/explainScore.test.ts` -> "the fifth paragraph says speed is scored separately", beside PAGEDETAIL-010's cases, which did not change. Specified in `openspec/specs/fe/src/Modules/PageDetail/spec.md`.

<!-- invariant: SIGNIN-001 -->
**One generic refusal for any bad credential, a distinct sentence for the throttle, and the inputs kept.** Pinned by `Modules/SignIn/SignInForm/SignInForm.test.tsx` -> "shows the refusal and keeps what was typed"; `Gateways/SessionGateway/SessionGateway.test.ts` -> "a 401 on login is { kind: 'invalid' }" and "a 429 on login is { kind: 'throttled' }". The absence of sign-up and reset offers is not pinned. Specified in `openspec/specs/fe/src/Modules/SignIn/spec.md`.

<!-- invariant: SIGNIN-002 -->
**Opening the sign-in route with a valid session goes straight to the pages list.** Pinned by `App/Router/router.test.tsx` -> "a signed-in visit to /sign-in goes to the pages list". Specified in `openspec/specs/fe/src/Modules/SignIn/spec.md`.

<!-- invariant: ISSUESUI-001 -->
**The Issues screen shows the client the URL names, else every client: by issue one list whose cards group their pages by client, with the clients not in it named once; by page one folded item per client, by name, with "Only this client"; it says so when a client is not found or there are none.** Pinned by `Modules/Issues/IssuesScreen.test.tsx` -> "with no client chosen, by issue: one list, each card's pages grouped by client", "with no client chosen, by page: each client folds open onto its pages", "in All clients, one client's failed read is named with Try again, the rest still listed", "Only this client narrows the report to that client", "says another user's or a deleted client was not found", "offers to add a client when there are none", "is behind the session guard"; `ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue.test.ts` -> the `groupByIssueAcrossClients` cases; `Modules/Issues/AllClientsByIssue/AllClientsByIssue.test.tsx`; `Modules/Issues/ClientIssues/ClientIssues.test.tsx` -> "as one client's item of All clients, by page"; `Modules/Issues/IssueCard/IssueCard.test.tsx` -> "across clients, groups the pages under each client's name and site"; `App/Router/SearchSchemas/IssuesSearchSchema/issuesSearchSchema.test.ts` -> "keeps a client and a page from the URL"; `ViewModels/IssueReportViewModel/IssueReportViewModel.test.ts` -> "files every client's report under its own client" and "drops a superseded answer — an earlier read of the same client". The client selector itself is NOT pinned. Specified in `openspec/specs/fe/src/Modules/Issues/spec.md`.

<!-- invariant: ISSUESUI-002 -->
**The three levels and what each means are shown above the findings.** Pinned by `IssuesScreen.test.tsx` -> "explains each problem in plain words, worst first, with the rubric in view" — in the view with rows only; "at all times" is NOT asserted for the empty and error states. The names come from `severityLabel` (SHELL-004). Specified in `openspec/specs/fe/src/Modules/Issues/spec.md`.

<!-- invariant: ISSUESUI-003 -->
**By default findings group by level, then by issue, widest first — a whole-site row counting its pages; by page, the whole site leads and pages order by Critical, then Important, then Improvement.** Pinned by `ViewModels/IssueReportViewModel/Services/GroupByIssue/groupByIssue.test.ts` -> "puts Critical first and leaves empty levels out", "orders a level by pages affected, a whole-site row counting its pages", "shows each problem once, with every page it was found on"; `Services/GroupByPage/groupByPage.test.ts` -> "leads with the whole-site rows", "orders pages by their Critical, then Important, then Improvement counts"; `issuesSearchSchema.test.ts` -> "defaults to grouping by issue, every level, every type"; the by-page view by `Modules/Issues/IssuesByPage/IssuesByPage.test.tsx` -> "leads with the whole site, then the page with the worst problems" and "counts each page's problems by level". The toggle control itself is NOT pinned. Specified in `openspec/specs/fe/src/Modules/Issues/spec.md`.

<!-- invariant: ISSUESUI-004 -->
**Filters by level (every level by default), type and URL live in the URL and run on the one snapshot; a page filter never hides the whole-site rows.** Pinned by `Services/FilterReport/filterReport.test.ts` -> "a page filter keeps site and whole-site rows", "searches page URLs and titles, case-insensitively, keeping whole-site rows", "keeps only the chosen levels", "keeps only the chosen type"; `issuesSearchSchema.test.ts` -> "defaults to grouping by issue, every level, every type", "lets the reader narrow the levels", "falls back to the defaults on malformed values"; `Services/IssueTypeOf/issueTypeOf.test.ts` -> "files the HTML speed risks under SEO" (O4, on purpose). Specified in `openspec/specs/fe/src/Modules/Issues/spec.md`.

<!-- invariant: ISSUESUI-005 -->
**Each issue reads what, why it matters and what to do, with the catalogue's technical text under a collapsed "Technical details".** Pinned by `Modules/Issues/IssueCard/IssueCard.test.tsx` -> "says what, why and what to do in the catalogue's plain words, with the level", "keeps the technical account folded until asked" and "names every page with the finding's own sentence, linked to the page"; `IssuesScreen.test.tsx` -> "explains each problem in plain words, worst first, with the rubric in view"; the lab note by `Core/Helpers/DescribeIssue/describeIssue.test.ts` -> "names a lab value as one". Specified in `openspec/specs/fe/src/Modules/Issues/spec.md`.

<!-- invariant: ISSUESUI-006 -->
**Every state of the report is said in words, and PageSpeed's state in the words the list and the page use.** Pinned by `Services/ReportViewOf/reportViewOf.test.ts` (one case per state family: rows, no clients, not found, no crawl yet, nothing found vs filtered out, a load failure, loading); `IssuesScreen.test.tsx` -> "says no crawl has finished yet", "says when the filters hide everything, and clears them", "says speed is not configured when there is no key" and "says, in red, that Google rejected the key". The words are shared through `Core/Constants/pageSpeedAvailabilityCopy.ts`, a `Record` over the states. Specified in `openspec/specs/fe/src/Modules/Issues/spec.md`.
