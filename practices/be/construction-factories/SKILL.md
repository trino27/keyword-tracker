---
name: construction-factories
description: Extract one static factory when the same object shape (a response DTO, a job payload, a record built from a crawl result) is assembled inline in two or more places. Do not extract for a single site or a 1-2 field object.
---

# Construction Factories

**Rule:** when the same object shape (same fields, same mapping) is built inline in 2+ places,
move it into one static factory and call that everywhere. *Why: adding a field otherwise means
finding every site, and one is always missed.*

Extract when the shape is built in 2+ places AND is non-trivial (4+ fields, a default, or a
conversion). Leave it inline when it appears once or has 1-2 fields.

## How

- A plain class with static methods: no `@Injectable`, no state, no DI. Callers import and call it.
- File `<name>.factory.ts` beside its spec, class `<Domain><Thing>Factory`
  (`PageResponseFactory.fromRecord(page, keywords, latestRank)`).
- Return the canonical interface (`IPageResponse`), not an anonymous object.
- Per-call values (the actor, the clock) are parameters; the factory only assembles the shape.
- An optional field that is absent is omitted, not set to `undefined`:

```ts
return finishedAt !== undefined ? { ...run, finishedAt } : run;
```

## Test

A pure function, so no mocks: assert the full shape, the default path, the override path and that
an omitted optional field is absent (`expect('finishedAt' in result).toBe(false)`).

Sibling rule for duplicated dispatch: [polymorphism-over-switch](../polymorphism-over-switch/SKILL.md).
