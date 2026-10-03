---
name: nestjs-best-practices
description: NestJS rules for this backend - DTO validation, the single error shape, transactions, guards, dependency injection and configuration. Use when writing controllers, services, guards or module wiring.
---

# NestJS Best Practices

Layering: [module-decomposition](../module-decomposition/SKILL.md). Folders:
[root-module-structure](../root-module-structure/SKILL.md).

## DTOs and validation

- Every body, query and param is a DTO class with class-validator decorators, validated in the
  controller layer, not in services.
- The global `ValidationPipe` (`whitelist: true`, `transform: true`) is registered once through
  `APP_PIPE` in `AppModule`, built by one factory function. Tests that need the pipe use the same
  factory. *Why: a pipe set up in `main.ts` is missing from every test that builds the module.*
- Response DTOs are explicit; never return a table row. Hide fields with an explicit mapping.
- A website URL is validated as `http`/`https` in the DTO (`@IsUrl({ protocols: ['http', 'https'], require_protocol: true })`).

```ts
export class CreateClientDto {
  @IsString() @Length(1, 120) name!: string;
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) websiteUrl!: string;
}
```

## One error shape

- Expected failures (not found, duplicate, not allowed) throw a `BusinessException` subclass made
  with `createException()`: a stable error code, an HTTP status, optional context. Error codes
  live in one `as const` map per module.
- A state that must be impossible (a finished crawl run without `finishedAt`) throws
  `InvariantViolationException`; it maps to 500 and is logged at `error`.
- A bare `new Error` is banned in `services/**` and `repositories/**` (ESLint).
- One exception filter turns every error into the same JSON body
  (`{ statusCode, errorCode, message }`); 4xx log at `warn`, 5xx at `error`. Never expose a raw
  database error: map constraint violations (unique `23505`, FK `23503`) to a `BusinessException`
  in the service.

## Transactions

- The service opens a transaction for any multi-step write and passes `tx` to each repository
  call. Keep it short: no HTTP calls and no crawling inside it.
- Work that follows a commit (starting a crawl) runs after the transaction, not inside it.

## Guards and decorators

- One guard per concern. Protect routes with one composite decorator (`@Auth()`), not a hand-written
  `@UseGuards(...)` list, so the order is correct everywhere.
- Read the user with a param decorator (`@CurrentUserId()`), not `@Req()`.
- A global `APP_GUARD` runs before route guards, so it cannot rely on `request.user`.

## Dependency injection and config

- Constructor injection only; parameter properties (`private readonly repo: PagesRepository`).
  The pino logger is the exception ([logging](../../logging/SKILL.md)).
- No `process.env` outside the config module; read through `ConfigService` and an `EnvKeys` map,
  validated at start-up. No secrets in code.
- Avoid `@Global()` modules except for config and logger.
- No state in services (a service is a singleton shared by every request).

## Anti-patterns

Business rules in controllers; repositories called from controllers; a service doing two unrelated
jobs; duplicated guard logic per method; hard-coded config values; `forwardRef`.
