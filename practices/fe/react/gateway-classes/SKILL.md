---
name: gateway-classes
description: The frontend boundary to the backend - one gateway class per resource on a shared base, zod-parsed responses, ApiError, a registry of instances, and discriminated responses where a 4xx is an expected answer. Use when adding an endpoint, a gateway, or a schema, or when a caller must branch on a backend error code.
---

# Gateway Classes

A gateway is the only code that knows a resource's URLs, request shapes and wire format. ViewModels call gateways; nothing else does.

```
Gateways/
  _Shared/
    Request/AppTransport.ts            appFetch(path, init): the ONLY fetch
    ABaseGateway/ABaseGateway.ts       abstract base
    Errors/ApiError/ApiError.ts        ApiError, toApiError, isUnauthorized
  PageGateway/
    PageGateway.ts
    Validation/PageSchemas.ts          zod schemas + T<Name> types
  gateways.ts                          one instance of each gateway
```

## Transport

`appFetch(path, init)` wraps `fetch` with `credentials: "include"` and a root-relative `/api` base (one origin in dev and in production, so the session cookie stays first-party and nothing needs CORS). It returns the `Response` untouched. ESLint `no-restricted-globals` makes this file the only one allowed to name `fetch`.

## Base class

```ts
export abstract class ABaseGateway {
	private readonly basePath: string;

	constructor(basePath: string) {
		this.basePath = basePath;
	}

	protected async request<S extends z.ZodType>(path: string, schema: S, init?: RequestInit): Promise<z.infer<S>> {
		const response = await appFetch(`${this.basePath}${path}`, init);
		if (!response.ok) throw await toApiError(response);
		return schema.parse(await response.json());
	}
}
```

(With `erasableSyntaxOnly` on, a parameter property is not allowed: declare the field and assign it.)

- **A gateway extends it and exposes one method per endpoint**, named for the intent (`list`, `get`, `create`), returning parsed data typed by `z.infer`. Callers never see a `Response`.
- **Every response is parsed.** A body the schema rejects throws a `ZodError`, which `describeError` words as "the server answered in a shape this app does not understand": a contract bug, not an outage. A mismatch never leaks into a screen as `undefined`.
- **Schemas live beside the gateway** in `Validation/<Entity>Schemas.ts`, and the data type is `export type TPage = z.infer<typeof pageSchema>`. A value used by both `be` and `fe` comes from `@app/contracts` instead of being declared twice.
- **Dates are ISO strings at the wire** (`z.iso.datetime()`); convert to the user's zone at the edge of the view, not inside the schema.
- **A non-JSON 200 is never a value.** If a proxy or the dev server answers `/api` with an HTML page, `response.json()` throws; let it, do not default it to empty data.

## Registry

`Gateways/gateways.ts` exports one instance of each:

```ts
export const gateways = { health: new HealthGateway(), pages: new PageGateway() };
```

ViewModels import `gateways`; tests spy on the class **prototype** (`vi.spyOn(PageGateway.prototype, "list")`), so no injection machinery is needed.

## Errors

`ApiError { status, errorCode, message }` is built by `toApiError(response)` from the backend's error body. **Branch on `errorCode` (stable), show `message` (for people).** `isUnauthorized(error)` is the one test for a 401. Define a typed subclass only if several call sites need `instanceof`; for a single site, compare `error.errorCode`.

## Discriminated responses

When one endpoint can succeed in two semantically different ways, return a union with a `kind` discriminant, not two URLs or optional fields:

```ts
const addClientResult = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("created"), client: clientSchema }),
	z.object({ kind: z.literal("exists"), clientId: z.number() }),
]);
```

The gateway returns the union and the ViewModel switches on `result.kind`. The same applies where a 4xx is an **expected answer** the caller must branch on (a duplicate website is an outcome, not a crash): the gateway catches that one `ApiError` code and returns the discriminated outcome, and rethrows everything else. Expected outcomes are values; unexpected failures are exceptions.
