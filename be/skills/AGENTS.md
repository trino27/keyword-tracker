# Backend skills

What is true of THIS backend (`be/`). Portable NestJS / Drizzle rules live in
[`practices/be/AGENTS.md`](../../practices/be/AGENTS.md); when a rule there and a rule here
disagree, the workspace skill wins.

| skill | decides | read when |
| --- | --- | --- |
| [`architecture-decisions/`](architecture-decisions/SKILL.md) | the layers, the error and transaction contracts, ownership in every query, and the patterns not used at this scale | before adding a layer, a pattern or infrastructure |
| [`performance-patterns/`](performance-patterns/SKILL.md) | batched and windowed reads of the snapshots table, pagination, bulk inserts, bounded outbound fetches | before writing a list query, touching snapshots, or adding a crawl call |
