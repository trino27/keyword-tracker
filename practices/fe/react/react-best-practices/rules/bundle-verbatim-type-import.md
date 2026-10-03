---
title: Inline `type` in a Value Import Defeats Code Splitting
impact: CRITICAL
impactDescription: a lazy third-party chunk lands on the critical path
tags: bundle, typescript, code-split, lazy, verbatimModuleSyntax
---

## Inline `type` in a Value Import Defeats Code Splitting

**This rule is not part of the Vercel set.** It is found by reading the one warning the bundler prints.

With `verbatimModuleSyntax: true` in `tsconfig.json`, TypeScript does not analyse what an import is used for; it emits the statement as written, minus
the type specifiers. So

```ts
import { type Types } from "heavy-sdk";
```

emits `import "heavy-sdk";` — a **side-effect import**, indistinguishable to any
bundler from a deliberate static dependency. Every `await import()` of that module elsewhere in the
file is then pointless: the module is already in the importing chunk, and the bundler says so
(`INEFFECTIVE_DYNAMIC_IMPORT`) in a warning that is easy to scroll past.

Nothing fails. The lazy boundary is simply not there.

**Incorrect — the split silently does not happen:**

```ts
import { type Types } from "heavy-sdk";

// Intended to keep the SDK off the critical path. It does not.
const sdk = await import("heavy-sdk");
```

**Correct — a fully type-only statement, which the compiler erases:**

```ts
import type { Types } from "heavy-sdk";

const sdk = await import("heavy-sdk");
```

Total shipped JavaScript is unchanged; what changes is when the heavy chunk is fetched.

**Where it does NOT apply.** A workspace that does not set `verbatimModuleSyntax` (check its `tsconfig.json`): TypeScript elides an unused import there and the form is harmless. And a file that ALSO imports the
module for its values (`import * as sdk from …`, used at runtime) has a static dependency
regardless; fixing the form there is correctness, not performance.

**Enforcement.** By review. `@typescript-eslint/consistent-type-imports` with `fixStyle: "separate-type-imports"` would make it mechanical; adopt it in `fe/eslint.config.mjs` if the form recurs.
