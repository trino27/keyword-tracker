---
name: polymorphism-over-switch
description: Replace a switch or if/else-if chain on an enum with a Record<TEnum, T> lookup (or a strategy class per case when each case has real behaviour). Use when the same enum is switched in 2+ places or a branch is non-trivial.
---

# Polymorphism over switch

**Rule:** dispatch on a fixed set of values with `Record<TEnum, T>`, not a `switch`. Use a strategy
class per case only when each case has real behaviour (several methods). Keep a `switch` or `if`
for a one-off, one-line, non-enum check (a status range, a regex).

*Why: a Record makes a missing member a compile error and keeps per-case data in one place; a
`switch` with `default` silently swallows the enum member added next year.* Where a `switch` over
an enum remains, `switch-exhaustiveness-check` (ESLint) catches a missing member.

## Record of values

```ts
export const SEO_ISSUE_SEVERITY_WEIGHT: Record<SeoIssueSeverityEnum, number> = {
  [SeoIssueSeverityEnum.INFO]: 1,
  [SeoIssueSeverityEnum.WARNING]: 3,
  [SeoIssueSeverityEnum.CRITICAL]: 10,
};

const score = issues.reduce((sum, i) => sum + SEO_ISSUE_SEVERITY_WEIGHT[i.severity], 0);
```

For a top-level constant that keeps literal types, add `as const satisfies Record<TEnum, V>`.

## Strategy per case

When each case needs several methods, write a small interface, one class per case, and a complete
registry:

```ts
interface IIssueCheck { check(page: IParsedPage): ISeoIssue[] }
export const ISSUE_CHECKS: Record<SeoIssueKindEnum, IIssueCheck> = {
  [SeoIssueKindEnum.TITLE]: new TitleCheck(),
  [SeoIssueKindEnum.HEADINGS]: new HeadingsCheck(),
};
```

A stateless strategy is instantiated once at load; it is not `@Injectable`. DI is for things that
integrate (repositories, clients), not for pure policy.

## Handlers that need `this`

When the dispatch is private to one service and handlers use its fields, keep a
`Partial<Record<TEnum, (...) => void>>` field of arrow functions.

## Do not

- Switch on the same enum in two files; extract one Record.
- Build a strategy hierarchy for two binary cases; a plain `if` is right.
- Migrate a lone, simple switch that is not changing. Migrate when you touch 2+ switches on one enum,
  or before adding a case that would touch 3+ files.

Sibling rule for duplicated construction: [construction-factories](../construction-factories/SKILL.md).
