---
name: path-aliases
description: Backend import convention - cross-scope imports use an alias (@core, @shared, @infrastructure, @modules, @persistence), imports inside one scope stay relative. A new alias must also be added to the Jest config. Use when writing a cross-scope import or adding an alias.
---

# BE Path Aliases

Source of truth: `be/tsconfig.json` `compilerOptions.paths`.

| Alias | Resolves to |
| --- | --- |
| `@core/*` | `be/src/core/*` |
| `@shared/*` | `be/src/shared/*` |
| `@infrastructure/*` | `be/src/infrastructure/*` |
| `@modules/*` | `be/src/modules/*` |
| `@persistence/*` | `be/src/persistence/*` |

Lowercase, matching folder names. There is no `@app/*` alias for `be/src/app/`: `@app/*` names the
workspace packages (`@app/contracts`), so the two would collide.

## The rule

**Cross-scope imports use the alias; imports within one scope are relative.** A scope is one
module (`modules/pages`) or one top-level folder (`core`, `shared`, ...). *Why: the alias shows
which layer a dependency crosses, and a module can move as a unit without rewriting its inside.*

```ts
// in modules/crawl/services/crawl-run/crawl-run.service.ts
import { EnvKeys } from '@infrastructure/config/env-keys.constant';
import { CrawlRunStatusEnum } from '@shared/crawl/enums/crawl-run-status.enum';
import { CrawlRunsRepository } from '../../repositories/crawl-runs.repository';
```

A value or type used by both the backend and the frontend belongs in `@app/contracts`; backend-only
vocabulary stays in `@shared`.

## Direction

`@core`, `@shared` and `@infrastructure` never import `@modules/*` (ESLint layer-direction rule).
Fix a violation by moving the type up to `@shared/<area>/`, or by moving the decorator or
interceptor into the module that owns what it needs.

## Tooling

- `tsc` and Nest read `paths`. The build is `nest build && tsc-alias -p tsconfig.build.json`:
  `tsc-alias` rewrites aliases to relative paths in the emitted JS.
- Jest needs `moduleNameMapper` in its config mirroring the alias list; `ts-jest` does not read
  `paths`.
- Scripts run with `ts-node -r tsconfig-paths/register`.
- **Only the build script may emit.** `be/tsconfig.json` has `noEmit: true`; a plain `tsc -b` would
  overwrite `dist/` with JS whose requires still say `@shared/...`, and the server then fails
  with `MODULE_NOT_FOUND`.

## Adding an alias

1. Add it to `tsconfig.json` `paths`.
2. Add the matching `moduleNameMapper` entry in the Jest config (and the ESLint resolver if it has one).
3. Check it does not collide with a package scope (`@app/*`, `@nestjs/*`).
