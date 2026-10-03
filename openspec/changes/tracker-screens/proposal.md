# Tracker screens — sign in, pages, page detail, clients

## Why

The brief's four screens: sign in, the pages list, the page detail with position history, and
adding a client (which also lists the user's clients, their crawl status, re-crawl and the run
log). They follow common data-table and rank-tracker layouts (D35), keep all list and range state
in the URL, show dates in the user's zone regardless of the reviewer's machine, and explain a
running or failed crawl in plain words.

## What Changes

- Mantine (core, dates, notifications), Recharts, SCSS modules, the Mantine PostCSS preset, jsdom
  stubs.
- Session ViewModel, a `beforeLoad` guard on the pathless app route, a single 401 handler, an
  AppShell with navigation and sign-out.
- Gateways for session, clients and pages with zod schemas typed against `@app/contracts`.
- ViewModels for clients (with polling), crawl status (banner polling), pages list and page detail.
- Screens: `/sign-in`, `/pages`, `/pages/$pageId`, `/clients`; the health home screen removed.

## Capabilities

- `fe/src/App` — SHELL-001…SHELL-004 (new).
- `fe/src/Gateways` — GATEWAY-001 (new).
- `fe/src/Modules/SignIn` — SIGNIN-001…SIGNIN-002 (new).
- `fe/src/Modules/Pages` — PAGELIST-001…PAGELIST-005 (new).
- `fe/src/Modules/PageDetail` — PAGEDETAIL-001…PAGEDETAIL-005 (new).
- `fe/src/Modules/Clients` — CLIENTSUI-001…CLIENTSUI-005 (new).
- `_root/time-zones` — TZ-004 (new).

## Impact

- `fe/` only (plus consumption of `@app/contracts`); `fe/package.json`, `fe/postcss.config.cjs`,
  `fe/vitest.setup.ts`, `fe/src/**`. Removes `Modules/Home/`, `ViewModels/HealthViewModel/`,
  `Gateways/HealthGateway/`.
