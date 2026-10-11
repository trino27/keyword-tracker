---
name: remote-api-core
description: Rules and a base class for outbound HTTP from the backend (the crawler fetching sitemaps and pages, a rank provider) - timeout, response size cap, retry with backoff, SSRF guard, user agent, validation, error mapping. Use when adding any code that calls fetch.
---

# Outbound HTTP

`RemoteApiCore` in `be/src/infrastructure/remote-api/` holds timeout, redirects, retry, the SSRF
checks and logging once, over a one-hop transport. Every client extends it; business code never
calls `fetch`. Not for SDK-based clients.

## Rules

1. **No `fetch` outside `RemoteApiCore`.** Services see typed domain values, not `Response`.
2. **Timeout on every request** (`AbortController`), from config. A hung site must not hold a worker.
3. **Cap the body.** Stop reading past a maximum (for example 2 MB for a page, 10 MB for a sitemap)
   and abort; follow at most ~5 redirects. Check `Content-Type` is the expected `text/html` or `xml`.
4. **Retry only what is safe**: network errors, timeouts, 429 and 502/503/504, on idempotent `GET`
   only, with exponential backoff and jitter (`250ms * 2^attempt + random`), 2-3 attempts, honouring
   `Retry-After`. Never retry 400/401/403/404; never retry a non-idempotent method.
5. **The target URL is user input (SSRF).** Allow `http`/`https` only; resolve the host and refuse
   loopback, private, link-local and metadata addresses (`127.0.0.0/8`, `10/8`, `172.16/12`,
   `192.168/16`, `169.254/16`, `::1`, `fc00::/7`); re-check after every redirect, and connect to the
   address you checked (resolving twice allows DNS rebinding). Crawl only the client's own origin.
6. **Send an honest `User-Agent`** (`SeoTrackerBot/1.0 (+contact-url)`), respect `robots.txt` where
   practical, and keep a polite pace per host (one request at a time, small delay).
7. **Validate every response at the boundary** with a Zod schema or parser; a crawled page is the
   most untrusted input there is. Parse HTML/XML with a real parser, never regex.
8. **Map every failure to a domain exception.** Only three generic errors leave an adapter:
   `RemoteApiTimeoutError` (504), `RemoteApiUnavailableError` (502), `RemoteApiResponseShapeError`
   (502). Everything else is a domain exception from the module's `errorMap`.
9. **Config from `ConfigService`**, never `process.env`; no cache or state in the client; one
   client per external service.
10. **Never log** full response bodies or credentials; the base class logs method, host, status,
    duration, attempt at `info` ([logging](../logging/SKILL.md)).

## Shape

Three layers, each replaceable on its own:

- **`IHttpTransport`** (token `HTTP_TRANSPORT`) sends ONE hop: no redirect following, no retries.
  It streams the body and stops at `maxBytes` of DECODED bytes, so a small gzip bomb cannot grow
  past it. The production transport is undici with an `Agent` whose `connect.lookup` resolves the
  host and refuses any non-public address; the socket connects to the address that was checked, so
  there is no DNS-rebinding window. Tests swap in a fixture transport, where an unknown URL is a
  404, never the network.
- **`RemoteApiCore`** owns policy: the per-hop URL check (http/https, no credentials, no private
  IP literal), up to 5 redirects followed one hop at a time so every hop is checked, a timeout per
  hop (the default, or what the caller declares up to 90 s), the caller's own headers sent only to
  the origin first asked — a redirect to another origin drops them, as browsers drop credentials,
  so an API key never follows a 3xx away — retries for 408/429/5xx/network with `250 ms * 2^attempt` plus jitter, honouring
  `Retry-After` (capped), the user agent, and one log line per hop.
- **One client per external service extends the core** and speaks the domain:

```ts
@Injectable()
export class SiteHttpClient extends RemoteApiCore {
  constructor(
    @Inject(HTTP_TRANSPORT) transport: IHttpTransport,
    @InjectPinoLogger(SiteHttpClient.name) logger: PinoLogger,
  ) {
    super(transport, logger);
  }

  async getHtml(url: string, signal: AbortSignal): Promise<ISiteResponse> {
    return toText(await this.get(url, { maxBytes: 5 * 1024 * 1024, accept: 'text/html', signal }));
  }
}
```

Failures are typed (`RemoteApiTimeoutError`, `RemoteApiUnavailableError`,
`RemoteApiForbiddenAddressError`, `RemoteApiTooLargeError`, `RemoteApiTooManyRedirectsError`),
each saying whether it is retryable; the caller turns them into domain outcomes (a crawl item
"Timed out"), never into a 500.

## Test

The core against a scripted fake transport: the redirect limit, a redirect to a private IP literal
refused without being requested, retry 503 then 200, no retry on 404, `Retry-After` waited (an
injected sleep), the user agent sent. The undici transport against a local `http.createServer`:
the body cap, gzip, no redirect following, and the production lookup refusing 127.0.0.1.


## Specified invariants

Deposited after archive (`openspec/README.md` §4 and §8): the permanent id, what must stay true,
and what pins it. Kept as a trailing section so the set is greppable.

<!-- invariant: REMOTE-001 -->
**No outbound connection reaches a non-public address, and the check is made per hop on the address actually connected to — not on the hostname.** Pinned by `be/src/infrastructure/remote-api/address-guard/address-guard.spec.ts` -> the "refuses %s (%s)" cases, including `169.254.169.254` and IPv4-mapped forms; `guarded-lookup/guarded-lookup.spec.ts` -> "refuses when ANY resolved address is private — no picking the safe one"; `remote-api.core.spec.ts` -> "refuses a redirect to a private IP literal without requesting it". Specified in `openspec/specs/be/src/infrastructure/remote-api/spec.md`.

<!-- invariant: REMOTE-002 -->
**Every outbound request times out — after 10 s unless its caller declares a longer bound, at most 90 s — follows at most five redirects, and stops reading at its size cap, counted on DECODED bytes.** Pinned by `remote-api.core.spec.ts` -> "refuses the 6th redirect", "honours a per-call timeout" and "caps a declared timeout at 90 s"; `undici-http-transport/undici-http-transport.spec.ts` -> "stops reading past maxBytes" and "counts DECODED bytes against the cap — a small gzip bomb is refused". The 10 s default VALUE is NOT pinned — only the behaviour is. That caller headers never follow a redirect to another origin is held by "drops caller headers on a redirect to another origin, keeps them on the same one"; no requirement id names it yet. Specified in `openspec/specs/be/src/infrastructure/remote-api/spec.md`.

<!-- invariant: REMOTE-005 -->
**A request made only for its status reads no body and frees its connection; an unrecorded status request in tests answers 200, never the network. (`openspec/specs/be/src/infrastructure/remote-api/spec.md`)** Pinned by `be/src/modules/crawl/services/site-http-client/site-http-client.spec.ts` -> "checkLink asks once, with no body"; `be/src/infrastructure/remote-api/_testing/fixture-http-transport.spec.ts` -> "an unrecorded URL asked for its status only answers 200".

<!-- invariant: REMOTE-003 -->
**At most two retries — fewer when the caller declares fewer — with backoff and jitter, only for a network error, a timeout, a 408, a 429 or a 5xx; `Retry-After` is honoured and capped.** Pinned by `remote-api.core.spec.ts` -> "retries a 503 and returns the following 200", "does not retry a 404", "waits what Retry-After asks before retrying a 429", "gives up after 2 retries of a timeout", "makes exactly one request with maxRetries 0 on a 503". The 408 is in `RETRYABLE_STATUSES` and not asserted by a case of its own. The cap on `Retry-After` and the jitter formula are NOT separately asserted. Specified in `openspec/specs/be/src/infrastructure/remote-api/spec.md`.

<!-- invariant: REMOTE-004 -->
**Every outbound request identifies this crawler in its User-Agent.** Pinned by `remote-api.core.spec.ts` -> "sends the bot user agent". The contact-URL suffix is NOT asserted. Specified in `openspec/specs/be/src/infrastructure/remote-api/spec.md`.
