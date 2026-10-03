---
name: core-infrastructure
description: Where a backend file belongs - the shared layers (core, shared, infrastructure, persistence) and a feature module. Use before creating a new file or folder in be/src.
---

# Where a Backend File Goes

```
be/src/
  core/             Nest plumbing with no domain meaning        @core
  shared/           pure domain vocabulary: enums, types, utils @shared
  infrastructure/   config, logger, outbound HTTP base          @infrastructure
  persistence/      Drizzle schema + the Postgres connection    @persistence
  modules/<name>/   feature modules (auth, clients, crawl, pages, rank-snapshots)  @modules
```

| Layer | Holds | Rule for entry |
| --- | --- | --- |
| `core/` | guards, filters, interceptors, pipes, decorators, `BusinessException` + `createException`, pagination and validation helpers | knows Nest/HTTP, knows no domain word |
| `shared/` | enums, interfaces, constants, pure utils (`date-range`, `timezone`) used by 2+ modules | pure: no Nest, no DI, no state |
| `infrastructure/` | `config/` (env keys), `logger/`, `remote-api/` | how to talk to a technology; never what a value means |
| `persistence/` | `schema/tables/`, shared column factories, the connection provider | nothing else touches the connection |
| `modules/<name>/` | everything with a business rule or a route | see [root-module-structure](../root-module-structure/SKILL.md) |

## Placing a file

1. Used by one module only? It stays in that module. Promote to a shared layer when a second module
   needs it, not before. *Why: premature sharing anchors module code in the wrong level.*
2. Needs DI or runtime state and carries a business opinion (a threshold, a classification such as
   "title longer than 60 characters is an SEO issue")? A feature module.
3. A pure function, enum or constant? `shared/` if it speaks domain words (`CrawlRunStatusEnum`),
   `core/` if it is HTTP/Nest plumbing (pagination shape).
4. A Nest primitive (guard, filter, interceptor, decorator)? The same-named folder in `core/`; if it
   needs a module's service or constants, it lives in that module instead.
5. A third-party client (a rank provider, a sitemap fetcher)? Built on `RemoteApiCore`
   ([remote-api-core](../../remote-api-core/SKILL.md)); the base class is infrastructure, the client
   is a module or sits inside the module that uses it.

## Import direction

`core`, `shared` and `infrastructure` never import `@modules/*` (ESLint layer-direction rule).
`infrastructure` does not import `core`; `core` may use `infrastructure`. A type needed by core code
moves up to `shared/<area>/`, or the code that needs it moves into its module.

## Naming

Folders `kebab-case`; files `<name>.<kind>.ts` (`env-keys.constant.ts`, `get-or-throw.helper.ts`);
class matches the file. One subsystem = one folder with a consistent prefix
(`remote-api.core.ts`, `remote-api.types.ts`, `remote-api.module.ts`), so one grep finds all of it.
Register a new Nest module in `AppModule` only if it needs global initialisation.
