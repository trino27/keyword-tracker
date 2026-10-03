# Positions and seed

## Why

The brief invents positions but takes pages and keywords from the live sites, and asks for at
least 50,000 snapshot rows stored in UTC. A reviewer needs one idempotent command that produces
two users, their two clients crawled through the real crawl path, and a believable daily history —
and running it again must neither duplicate rows nor break the walks.

## What Changes

- Table `rank_snapshots` keyed by (page, keyword, captured instant) with a composite FK to
  `page_keywords` and a 1–100 CHECK.
- `be/src/seed/`: a CLI over a Nest application context; users and clients upserted; seed clients
  without a successful run crawled through the worker (`trigger = 'seed'`); positions generated for
  every current pair by a deterministic mean-reverting walk ending at the latest 12:00 UTC.
- Compose service `seed` (`profiles: [tools]`), `pnpm seed`, `SEED_USER_PASSWORD` in
  `.env.example`.

## Capabilities

- `be/src/modules/pages` — PAGES-001 (new; the rest of this capability arrives in
  `pages-and-position-history`).
- `be/src/seed` — SEED-001…SEED-005 (new).

## Impact

- `pages` module gains `RankSnapshotsRepository` and `PositionSeedService`; `auth` exposes
  `UserAccountsService.upsertUserForWorker`; `clients` exposes `enqueueForWorker`;
  `docker-compose.yml`, `.env.example`, root and be `package.json`.
