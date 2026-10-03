---
name: root-module-structure
description: Folder vocabulary of a backend feature module (controllers, dto, services, repositories, interfaces and a few optional ones). Use when creating a module or adding a folder or file to one.
---

# Feature Module Structure

Every direct child of `be/src/modules/` is a feature module. Shared code lives in
`core/ shared/ infrastructure/ persistence/` ([core-infrastructure](../core-infrastructure/SKILL.md)).

```
modules/crawl/
  crawl.module.ts
  controllers/      HTTP routes: routing and DTO binding only
  dto/              request/response classes with class-validator decorators
  services/         use cases; one service per concern
  repositories/     the only place that talks to Drizzle
  interfaces/       domain interfaces (ICrawlRun, ...)
  exceptions/       module errors built with createException()
  constants/        module-scoped constants, error codes
  guards/ decorators/ scheduler/ factories/ validators/   only when the first file exists
```

- Each tested unit gets its own folder with its spec:
  `services/crawl-run/crawl-run.service.ts` + `crawl-run.service.spec.ts`
  ([testing-patterns](../testing-patterns/SKILL.md)).
- File `<name>.<kind>.ts`, class `PascalCase` matching it: `crawl-run.service.ts` ->
  `CrawlRunService`, `pages.repository.ts` -> `PagesRepository`.
- Name services by the use case, not CRUD: `CrawlRunService`, not `CrawlCreateService`.
- Do not create empty folders. A folder appears with its first file.
- A folder outside this list is a design decision: say why in the PR.
- No `index.ts` barrels; import the symbol from its file.
