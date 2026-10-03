---
name: naming
description: How a type, class, function, folder and constant file is NAMED in this repository — the prefix and suffix conventions, the framework-reserved exception, and what enforces each. True of every workspace and every platform. Read before naming a new interface, type alias, enum, class or folder, and before adding a naming rule to an ESLint config.
---

# Naming

**One table, every workspace.** These conventions hold in `be` and `fe` alike — they are about
TypeScript and about this repository's habits, not about any framework.

| Target | Rule | Example |
| --- | --- | --- |
| Interface | `I` prefix + PascalCase | `ICrawlRunPayload` |
| Type alias | `T` prefix + PascalCase | `TButtonVariant`, `TRankRange` |
| Enum | PascalCase + `Enum` suffix | `SeoIssueSeverityEnum` |
| Class | PascalCase, optionally `A`-prefixed when abstract (regex `^A?[A-Z]`) | `PageRepository`, `ACrawlStrategy` |
| Function | camelCase; a React component is PascalCase | `useClientList`, `buildRankSeries` |
| Variable | camelCase, or `UPPER_SNAKE_CASE` for a constant | `DEFAULT_PAGE_SIZE`, `crawlRunId` |
| Folder | PascalCase on the frontend, kebab-case on the backend | `Button/`, `_Shared/` — `rank-snapshot/` |
| Constant file | the exported const is `UPPER_SNAKE_CASE` | `export const RANK_WINDOW_DAYS = …` |

**What enforces it:** `@typescript-eslint/naming-convention`, configured per workspace. A rule
added to one workspace's config and not the other is how these drift, so change them together
or state in the config why one differs. Where a convention is not yet in the config, review is
the enforcer.

## The framework-reserved exception

**A Nest decorator's parameter name** where the framework resolves by identifier rather than by
type is exempt: our convention would break the code. Where that applies is
`practices/be/nestjs/`'s.

## Why a folder differs by platform and that is not an inconsistency

The frontend names a component folder after the component, which is PascalCase because the
component is; the backend names a module folder after the bounded context, which is kebab-case
because it is a path segment and a Nest module name, never a symbol. Two different things being
named after two different things is not drift. `fe/skills/folder-structure/SKILL.md` and
`practices/be/nestjs/module-decomposition/SKILL.md` own the placement half of each.
