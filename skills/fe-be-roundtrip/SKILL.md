---
name: fe-be-roundtrip
description: >
  The seam between the frontend and the backend — how a user action becomes an HTTP request,
  a controller and DTO, a service and repository call, a response, and a re-render. Use when
  changing anything that crosses the boundary: an fe API call, a controller or DTO, a response shape,
  or a contracts type. Also use when an fe and a be change ship together.
---

# The FE ↔ BE round trip

**Why this file exists.** The fe docs own the fe half, the be docs own the be half, and
**nothing else owns the seam**. A reader asked to "trace adding a client from the form to the
list" would otherwise have to read TypeScript on both sides.

This file owns the SHAPE of the round trip. It does not restate either half's rules:
`fe/skills/` owns the fe half, the module `*_MODULE.md` files own be behaviour, and
`packages/contracts` owns what both sides import.

*Examples below are illustrative — they show the shape with this product's nouns (client, page,
rank snapshot, crawl run), not a claim that those endpoints exist yet.*

---

## The path

```
 fe component (React + Vite SPA, `fe/`)
   └─ ViewModel action -> gateway method, response parsed by a zod schema
        └─ HTTP /api/…   (Caddy proxies /api to be; one origin)
             └─ Controller + DTO      narrows and delegates
                  └─ Service          business rules, transaction
                       └─ Repository  the only place that talks SQL
                            ↓
                       response → validated → re-render
```

The request is something the caller awaits; its response is the only way the screen learns the
result. There is no push channel: a screen that must show another actor's change refetches.

## 1. FE → BE: the request half

**One place on the fe knows the API URLs: the gateway classes** (`practices/fe/react/gateway-classes/SKILL.md`).
Every `/api/...` call is a gateway method called by a ViewModel action; `fetch` appears only in the
transport, which ESLint enforces (`no-restricted-globals`, `no-restricted-imports`).

The gateway also **validates the response** with a schema (zod) before anything downstream sees it.
A backend field that changes shape surfaces there as a parse failure, not as an undefined three
layers up.

On the backend the request lands on a controller whose DTO carries `class-validator`
decorators. The DTO is the contract: if a field is not on the DTO it does not exist, regardless
of what the client sent. Business rules are NOT in the controller — it narrows and delegates.

**Every request is scoped to the signed-in user.** The controller takes the user from the
authenticated request, never from a body or query field, and the service and repository filter by
it: a user must never reach another user's client, page or snapshot. Scoping in the repository
query (not "load, then check") is the version that cannot be forgotten in a new endpoint.

**When you change a request shape you are changing two files that no compiler links** unless the
shape is in `@app/contracts`. The fe request type and the be DTO are separate declarations. Where
the value-object is genuinely shared, put it in `@app/contracts` and import it on both sides —
that is what the package is for (`skills/be-canonical-fe-mirror/SKILL.md` says what belongs there).

## 2. BE → FE: the response half

The response is a plain JSON body whose shape is the be's response type. Dates cross the wire as
ISO strings in UTC; the fe converts to the user's zone (Toronto) for display and for building a
range, and the be never receives a zone-less local date.

A response shape that both sides need to agree on lives in `@app/contracts`
(`IHealthResponse` is the smallest example); the fe schema is then the runtime check
for what the type promises.

The fe takes the response into its state and the component re-renders.

### Realtime is not part of this seam

Nothing here pushes to a client. If a push channel (SSE) is added later, its wire format belongs
in `@app/contracts` beside the other shared types, the be sends only after the transaction
commits, and the fe re-validates every payload as untrusted input exactly as it does for an
HTTP response. Until then, do not write a client-side "listener" for an event nobody sends.

## 3. What must change together

| You changed | You must also change | What catches you if you forget |
|---|---|---|
| A request body field | the be DTO **and** the fe request type; prefer `@app/contracts` for shared value-objects | nothing automatic unless the type is shared — this is the seam's weakest point |
| A response field | the fe response schema, and the fe type | the parse fails at runtime, loudly |
| A `@app/contracts` type | rebuild the package, then typecheck both `be` and `fe` | `pnpm typecheck` builds contracts first and fails on both sides |
| Who may see a record | the be service/repository scoping only | nothing on fe — do not add a client-side filter |

## 4. Worked trace — adding a client

1. **FE** — the user submits the form (name and website URL). The fe `POST`s `{ name, websiteUrl }` to `/api/clients`.
2. **BE** — the controller validates the DTO (`@IsUrl` on the URL, a length cap on the name) and
   passes the authenticated user's id and the DTO to the service. The service creates the client
   row for that user and starts a crawl run for it, in one unit of work, and returns the client
   with the run's status.
3. **BE** — the crawl itself reads the site's blog sitemap and takes the first 15 posts. It is not
   part of the request's contract: the response says the run was started, not that it finished.
4. **FE** — the gateway parses the response with its schema, the ViewModel adds the client to its state, and the
   list re-renders. Pages appear as the crawl produces them, on the next
   fetch of the page list.

Every rule referenced above lives in the document that owns it. This section is a map, not a
second copy of them.

## 4b. A worked BREAKING change — a field becomes nullable

Suppose a page's latest rank position becomes nullable because a page can be crawled before any
rank snapshot exists.

**What has to change together**, and this is the list that makes it a round-trip example rather
than a backend change:

| layer | change |
| --- | --- |
| `@app/contracts` | the response type (`position: number \| null`) — one definition, both sides |
| be response | the repository and service return `null` instead of `0` — a `0` is a position, not "none" |
| fe zod schema | the same nullability, or the parse throws and the whole screen dies |
| fe comparisons | `a.position - b.position` becomes an explicit null check; `?? -1` sentinels around sorting hide the difference between "unranked" and "ranked last" |

Making one response field nullable is not a local change: it is a change to every consumer that
reads it, and the compiler finds them one layer at a time. Plan a conversion of this shape as
several passes and make each pass's commit state what it verified.

And the fe schema is where a wire change becomes visible or invisible: a field the be started
sending as `null` against a non-nullable zod schema is not a wrong value on screen, it is a
thrown parse and an empty page. Widen the schema in the SAME change as the DTO.

## 5. Answering a round-trip question

Read in this order — it is the order that stops you reading source code:

1. **This file** for the shape and for what must change together.
2. `packages/contracts/src/domain/<domain>/` for the exact shared type.
3. The be `*_MODULE.md` / `*_LIFECYCLE.md`, if the module has them, for what the backend does and
   in what order.
4. `fe/skills/` and the fe code that calls the endpoint, for what the frontend does with the
   response.

If you still had to open `.ts` to answer, that is a defect in one of those four — say so, and
say which question it could not answer.
