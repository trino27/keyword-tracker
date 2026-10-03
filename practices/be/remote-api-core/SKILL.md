---
name: remote-api-core
description: Rules and a base class for outbound HTTP from the backend (the crawler fetching sitemaps and pages, a rank provider) - timeout, response size cap, retry with backoff, SSRF guard, user agent, validation, error mapping. Use when adding any code that calls fetch.
---

# Outbound HTTP

One abstract base class, `RemoteApiCore` in `be/src/infrastructure/remote-api/`, holds timeout,
retry, logging, parsing and error mapping once. Every client extends it; business code never calls
`fetch`. Not for SDK-based clients.

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

```ts
export abstract class RemoteApiCore {
  protected abstract readonly logger: PinoLogger;
  protected constructor(protected readonly config: RemoteApiConfig) {}

  protected async request<T>(opts: RequestOptions<T>): Promise<T> { /* guard, fetch with
     timeout + size cap, retry loop, parse, schema.safeParse, errorMap */ }
}

interface RemoteApiConfig { timeoutMs: number; maxBytes: number; retry?: { attempts: number; on: number[] }; headers?: Record<string, string>; }
interface RequestOptions<T> {
  url: string; method: 'GET' | 'POST';
  parse: 'json' | 'text';
  schema: { safeParse(raw: unknown): { success: true; data: T } | { success: false; error: unknown } };
  errorMap?: Record<number, (res: Response) => Error>;
}
```

A client:

```ts
@Injectable()
export class SitemapFetcher extends RemoteApiCore {
  protected readonly logger: PinoLogger;
  constructor(config: ConfigService, @InjectPinoLogger(SitemapFetcher.name) logger: PinoLogger) {
    super({ timeoutMs: config.getOrThrow(EnvKeys.CRAWL_FETCH_TIMEOUT_MS), maxBytes: 10_000_000, retry: { attempts: 3, on: [429, 502, 503, 504] } });
    this.logger = logger;
  }

  async getPostUrls(sitemapUrl: string, limit: number): Promise<string[]> {
    const sitemap = await this.request({ url: sitemapUrl, method: 'GET', parse: 'text', schema: SitemapSchema,
      errorMap: { 404: () => new SitemapNotFoundException() } });
    return sitemap.urls.slice(0, limit).map((u) => u.loc);
  }
}
```

The caller validates the URL (rule 5) before it reaches `getPostUrls`.

## Test

Replace `global.fetch` with `jest.fn()` and cover: happy path, retry then
`RemoteApiUnavailableError`, abort -> `RemoteApiTimeoutError`, body over the cap, a redirect to a
private address, schema mismatch, and each `errorMap` entry.
