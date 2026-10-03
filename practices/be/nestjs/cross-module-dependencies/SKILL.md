---
name: cross-module-dependencies
description: How one backend module uses another - through an exported service, never another module's repository - and how to avoid circular dependencies. Use when wiring a dependency between modules or when a cycle or forwardRef appears.
---

# Cross-Module Dependencies

**Rule:** module A uses module B only through a service B exports. A never imports B's repository,
its internal services or its exceptions. *Why: B's tables and rules stay B's to change.*

```ts
// crawl needs the client's website URL and to know the caller owns the client
constructor(
  private readonly runs: CrawlRunsRepository,   // own repository
  private readonly clients: ClientsService,     // exported by ClientsModule
) {}
```

- `ClientsModule` lists `ClientsService` in `exports` and nothing else. If several modules call
  into one module, it may export more than one service (`PagesService`, `PageKeywordsService`),
  each covering one concern.
- Methods other modules call return domain interfaces (`IClient`, `IPageRecord`), never a
  `*DbModel` ([db-access-boundary](../../drizzle/db-access-boundary/SKILL.md)). Every field a
  caller reads must be declared on the interface and populated.
- A method that skips the ownership check (internal lookup by id) gets a name that says so
  (`findPageRecordById`) and takes the `tx` it should run in; the public use-case method takes
  `userId`.
- Cross-module calls that must be atomic take the caller's `tx` and run inside its transaction.
- Do not read another module's table through your own repository to save a call.

## No cycles

`forwardRef` is not allowed. If A needs B and B needs A, one dependency points the wrong way.
Fix by:

1. **Moving the shared piece down.** A type or enum both use goes to `shared/<area>/`.
2. **Moving the orchestration up.** An endpoint that needs both goes in the module that already
   depends on both (`crawl` depends on `clients` and `pages`; neither depends on `crawl`).
3. **Dropping the reverse call.** The owner of a fact never imports its consumer; the consumer
   passes in what the owner needs (`ClientsService.create` returns the client, the caller then
   starts the crawl).

## Side effects after a commit

If a use case must trigger something that does not affect its result (starting a crawl once a
client row is committed), run it after the transaction commits, not inside it. A failure in the
follow-up must not roll back the write, so log it and record the failure (for example a crawl run
in status `failed`).
