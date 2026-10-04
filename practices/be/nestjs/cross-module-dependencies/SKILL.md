---
name: cross-module-dependencies
description: How one backend module uses another - through an exported service, never another module's repository - and how to avoid circular dependencies. Use when wiring a dependency between modules or when a cycle or forwardRef appears.
---

# Cross-Module Dependencies

**Rule:** module A uses module B only through a service B exports. A never imports B's repository,
its internal services or its exceptions. *Why: B's tables and rules stay B's to change.*

```ts
// crawl executes a run; the rows it walks belong to the clients module, so it reads
// and advances them through the service that module exports
constructor(
  private readonly runs: ClientCrawlRunsService, // exported by ClientsModule
  private readonly results: CrawlResultsService, // exported by PagesModule
  private readonly analysis: PageAnalysisService,// exported by PageAnalysisModule
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
   passes in what the owner needs.
4. **Giving the table to the writer that needs it atomically.** When the two needs are a write
   that must be in one transaction and a read that happens later, the table goes to the writer
   and the reader gets an exported service.

   This is the one the crawl queue took, and it is worth reading before deciding a module looks
   wrong. `crawl_runs` and `crawl_run_items` live in `clients`, not in `crawl`: creating a client
   enqueues its first run in the same transaction as the client row, so a client with no queued
   run cannot exist, while `crawl` only ever claims and advances rows and can do that through
   `ClientCrawlRunsService`. Had the queue gone to `crawl`, clients would need crawl to enqueue
   and crawl would need clients to resolve the site — a cycle, and `forwardRef` is not allowed.

   The visible cost is that `crawl` owns no table and `clients` holds two aggregates and two
   route prefixes (`/clients`, `/crawl-runs`). That is the price of the acyclic graph, and it is
   recorded in `clients.module.ts` so the next reader does not take it for an accident.

## Side effects after a commit

If a use case must trigger something that does not affect its result (starting a crawl once a
client row is committed), run it after the transaction commits, not inside it. A failure in the
follow-up must not roll back the write, so log it and record the failure (for example a crawl run
in status `failed`).
