---
name: logging
description: Backend logging with pino - where to log, how to inject the logger, levels, the bindings object, static messages, trace-id correlation, and what never to log. Use before adding a logger.* call.
---

# Logging

## Already logged, do not repeat

`pino-http` logs every request (method, url, status, duration, request id, `userId`), the exception
filter logs every error (4xx `warn`, 5xx `error`), and the outbound HTTP base class logs every
external call ([remote-api-core](../remote-api-core/SKILL.md)). So: no logging in controllers, and
none in plain repositories (only for retry or fallback logic of their own).

**Log in services**, at the end of a business operation (`info`), at a recoverable anomaly (`warn`),
and where an error is caught and handled (`error`). Seed and crawl jobs log progress per batch, not
per row.

## Injecting

Inject with `@InjectPinoLogger(ClassName.name)` using the concrete class, and assign it in the
constructor body. Importing Nest's `Logger` is banned by lint; bootstrap code before DI uses
`bootstrapLogger.child(...)`.

```ts
private readonly logger: PinoLogger;
constructor(private readonly runs: CrawlRunsRepository, @InjectPinoLogger(CrawlRunService.name) logger: PinoLogger) {
  this.logger = logger;
}
```

## Levels

| Level | Use for |
| --- | --- |
| `error` | an operation failed and could not complete |
| `warn` | recoverable: a retry, a skipped page, a degraded dependency |
| `info` | a significant operation completed (client created, crawl run finished) |
| `debug` | a step inside an operation |

## Call shape

Bindings object first, then a **static** message. No interpolation: the message is what you group
by, the bindings are what you filter by.

```ts
this.logger.info({ clientId, pagesFound }, 'Crawl run finished');
this.logger.error({ err: error, url }, 'Failed to fetch sitemap');
this.logger.warn({ clientId, url, attempt }, 'Fetch retry');
```

- Errors are always `{ err: error }` (the raw `Error`, never `.message`); pino serialises it.
- Bindings are ids, counts, durations, status. An `error` call whose first argument is a string is
  a defect (review).
- Adapters add `{ service, op }` to degraded-mode warnings.
- Pino runs `formatters.log` before serialisers, so a formatter sees the raw error. Test
  logging config against a real pino instance, not by hand-composing the pieces.

## What never goes in a log

Passwords, tokens, cookies, `Authorization` headers, email addresses and full request bodies. Redact
them in the pino config (`redact`) as a backstop, but do not rely on it. Log the client id, not the
client's name or contact.

## Correlation

Every line carries a `traceId` stamped by the pino `mixin`: one id per request, also returned as
`X-Request-ID`. Never add it by hand. Work that starts outside a request (a crawl job, the seed
script) wraps itself in `runWithTraceId(undefined, ...)` to mint one. This is log context only,
never business logic.
