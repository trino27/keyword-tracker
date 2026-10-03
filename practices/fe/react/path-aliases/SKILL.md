---
name: fe-path-aliases
description: Frontend import convention - one alias per layer (@App, @Core, @Gateways, @Modules, @ViewModels); an import that crosses a layer uses the alias, an import inside one layer stays relative. Use when adding an import that leaves its layer, or when tempted to add an alias.
---

# Frontend Path Aliases

**One alias per layer, declared once** in the workspace's `tsconfig.json` `compilerOptions.paths`. `tsc`, Vite and Vitest (`resolve.tsconfigPaths: true`) all read it from there. Do not repeat aliases in `vite.config.ts`, and do not add a second alias for a layer: two spellings of one file are how a move leaves half its imports dangling.

| Alias | Resolves to | For |
| --- | --- | --- |
| `@App/*` | `src/App/*` | router, guards |
| `@Core/*` | `src/Core/*` | configs, constants, types, helpers |
| `@Gateways/*` | `src/Gateways/*` | gateways, their schemas and errors |
| `@Modules/*` | `src/Modules/*` | screens and components |
| `@ViewModels/*` | `src/ViewModels/*` | stores |

Casing matches the folder: `@Core`, not `@core`. The glob matcher in lint rules is case-insensitive, so a rule on `@App/*` must be written as a case-sensitive regex or it also matches the `@app/contracts` package.

## The rule

- **Leaves its layer: alias.** `import { describeError } from "@Core/Helpers/DescribeError/describeError"`.
- **Stays inside its layer: relative.** `./PageRow.module.scss`, `../IssueTag/IssueTag`.

The alias in an import line therefore names the dependency being taken, which is what makes layer direction reviewable at a glance (`mvvm-layers`). If you need more than two `../` inside a layer, the target is probably another area and wants a clearer home.

Direction is a separate question from spelling: an alias that may be written is not thereby allowed (`Core/` never writes `@Modules/...`).

## Workspace packages are not aliases

`@app/contracts` is a `workspace:*` dependency imported by its package name. A value used by both `be` and `fe` belongs there; frontend-only helpers and the zod response schemas stay in `fe/`.
