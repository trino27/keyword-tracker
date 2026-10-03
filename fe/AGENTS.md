# fe/ — React single-page app

React 19 + Vite, MVVM: zustand ViewModels, gateway classes, TanStack Router, zod, Mantine with SCSS modules,
Vitest. No SSR — everything is behind a sign-in. In docker the build is served by Caddy, which
also proxies `/api`; in development Vite's server proxies `/api` to the backend.

## Read first

- [`fe/skills/AGENTS.md`](skills/AGENTS.md) — this app's structure, data retrieval, error display, tests.
- [`practices/fe/AGENTS.md`](../practices/fe/AGENTS.md) — portable MVVM, routing, forms, React rules.

## Layout

```
src/
  main.tsx, index.scss
  App/        Router (route tree), Guards
  Core/       Configs, Helpers — no feature knowledge
  Gateways/   one class per backend resource, Validation/ zod schemas, _Shared/, gateways.ts
  ViewModels/ one zustand store per screen or entity, Services/ for pure logic
  Modules/    screens and their components, _Shared/ UI
```

Aliases: `@App/* @Core/* @Gateways/* @Modules/* @ViewModels/*` — across layers; relative inside one.

## Commands

```bash
pnpm --filter fe dev           # :5173, proxies /api to :3000
pnpm --filter fe lint
pnpm --filter fe typecheck
pnpm --filter fe test:ci
pnpm --filter fe build
```

## Enforced by ESLint

Only ViewModels import gateway values (types are fine anywhere); `Core/` and `Gateways/` never
import `@Modules/@App/@ViewModels`; `fetch` only in `Gateways/_Shared/Request/AppTransport.ts`;
no `index.ts` barrels.
