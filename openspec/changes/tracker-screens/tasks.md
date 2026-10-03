# Tasks — tracker-screens

Generated from the plan `keyword-tracker` (docs/_plans/), Phase 7. Correct it through the plan;
record a wrong task with an `AMENDED during implementation:` line and an already-satisfied one as
`VERIFIED, NOT BUILT`.

## 1. Shell, session and sign-in (7a) — SHELL-001…SHELL-003, SIGNIN-001, SIGNIN-002, GATEWAY-001, TZ-004

- [ ] 1.1 Add `@mantine/core @mantine/hooks @mantine/dates dayjs @mantine/notifications recharts sass-embedded` and dev `postcss postcss-preset-mantine postcss-simple-vars`; `fe/postcss.config.cjs`; stubs for `matchMedia`, `ResizeObserver`, `scrollIntoView` in `fe/vitest.setup.ts`; `MantineProvider` + `Notifications` + stylesheets in `main.tsx`; `Core/Configs/theme.ts`. Confirm the installed Mantine major (plan Q12). Verify: `pnpm --filter fe test:ci && pnpm --filter fe build`
- [ ] 1.2 Write `safeRedirectPath.test.ts`, `formatInZone.test.ts` (Toronto Oct 31 vs Tokyo Nov 1 for 2026-11-01T03:30Z), `unauthorizedSignal.test.ts`, `SessionGateway.test.ts` (me 401 → null; login 401 → `{ kind: 'invalid' }` without notifying; 429 → `{ kind: 'throttled' }`; wrong shape refused), `SessionViewModel.test.ts` (shared in-flight `fetchSession`, sign-out resets), `SignInForm.test.tsx`, a router test (signed-out `/pages` → `/sign-in?redirect=%2Fpages`); they fail. Verify: `pnpm --filter fe test:ci` fails
- [ ] 1.3 Implement helpers, `UnauthorizedSignal` + `ABaseGateway` option, `SessionGateway` + schemas typed `z.ZodType<ISessionUser>`, `SessionViewModel`, guards, router (sign-in, pathless app, `/` → `/pages`, placeholder `/pages`, `errorComponent`, `notFoundComponent`), shared `AppLayout`/`PageHeader`/`SectionError`/`EmptyState`/`NotFound`/`RouteError`, `Modules/SignIn/**`; remove `Modules/Home/`, `ViewModels/HealthViewModel/`, `Gateways/HealthGateway/`. Verify: `pnpm --filter fe test:ci && pnpm --filter fe typecheck && pnpm --filter fe lint && pnpm --filter fe build`
- [ ] 1.4 Stack. Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/sign-in | grep -q 'id="root"'`

## 2. Clients screen (7b) — CLIENTSUI-001…CLIENTSUI-005, SHELL-004

- [ ] 2.1 Write `ClientGateway.test.ts` (409 → exists, 400 → invalidUrl, recrawl 409 → active, run detail parsed), `ClientsViewModel.test.ts` (refused add keeps clients and sets `actionError`/`fieldErrors`; polling only while active, stopped by `stopPolling` and `reset`, fake timers; superseded fetch), services tests (`summarizeClients`, `hasActiveRun`, `findClientBySiteKey`), `CrawlStatusViewModel.test.ts`, `AddClientForm.test.tsx` (409 link), `ClientsTable.test.tsx` (re-crawl disabled while active), `RunLog.test.tsx` (sitemap order, badges); they fail. Verify: `pnpm --filter fe test:ci` fails
- [ ] 2.2 Implement `Core/Constants/crawlStatusColor.ts` (`Record<TCrawlRunStatus, …>`), `ClientGateway`, both ViewModels and services, `CrawlStatusBadge`, `Modules/Clients/**`, route `/clients` and its nav item. Verify: `pnpm --filter fe test:ci && pnpm --filter fe typecheck && pnpm --filter fe build`
- [ ] 2.3 Stack. Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/clients | grep -q 'id="root"'`

## 3. Pages list (7c) — PAGELIST-001…PAGELIST-005

- [ ] 3.1 Write `pagesSearchSchema.test.ts` (fallbacks), `positionBucket.test.ts`, `PageGateway.test.ts` (list), `PagesViewModel.test.ts` (`emptyKind`, superseded, silent refresh failure), `describeResultRange.test.ts`, `describeRunProgress.test.ts`, `PagesTable.test.tsx` (loading, error, both empty states, "—"), `CrawlBanner.test.tsx`, `PagesFilterBar.test.tsx` (300 ms, page reset); they fail. Verify: `pnpm --filter fe test:ci` fails
- [ ] 3.2 Implement the search schema, `PositionBucket`, `PageGateway.list`, `PagesViewModel`, `PositionBadge`, `Modules/Pages/**`; replace the placeholder; screen chains `refreshPages` and `refreshClients` on a terminal transition. Verify: `pnpm --filter fe test:ci && pnpm --filter fe typecheck && pnpm --filter fe build`
- [ ] 3.3 Stack. Verify: `docker compose up -d --build && curl -fsS http://localhost:8080/pages | grep -q 'id="root"'`

## 4. Page detail (7d) — PAGEDETAIL-001…PAGEDETAIL-005

- [ ] 4.1 Write `pageDetailSearchSchema.test.ts`, `PageGateway.test.ts` (get, positions, unknown issue code refused), `resolveRange.test.ts`, `buildHistoryTable.test.ts`, `groupIssues.test.ts`, `PageDetailViewModel.test.ts` (history superseded on a double range change, not-found on 404), `PositionTable.test.tsx`, `KeywordToggles.test.tsx`, `IssuesSection.test.tsx`; they fail. Verify: `pnpm --filter fe test:ci` fails
- [ ] 4.2 Implement the search schema, gateway methods, `PageDetailViewModel` and services, `Modules/PageDetail/**`; make list rows link to the detail; breadcrumb restores the list search. Verify: `pnpm --filter fe test:ci && pnpm --filter fe typecheck && pnpm --filter fe lint && pnpm --filter fe build`
- [ ] 4.3 Seeded stack walk-through. Verify: `docker compose up -d --build && docker compose run --rm seed && curl -fsS http://localhost:8080/pages/1 | grep -q 'id="root"'`, then in a browser sign in as both seed users, open a page, switch ranges and views, expand the Yoast run log
