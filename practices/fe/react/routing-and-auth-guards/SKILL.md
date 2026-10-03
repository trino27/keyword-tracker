---
name: routing-and-auth-guards
description: Routing a React SPA with TanStack Router's code-based route tree. A guard in a pathless layout route's beforeLoad that asks the session ViewModel, URL search params validated as list state, redirecting to sign-in on 401, and why the guard is not the security boundary. Use when adding a route, a protected area, a filter or pagination, or touching the router.
---

# Routing and Auth Guards

The API names below are the stable TanStack Router surface (`createRootRoute`, `createRoute`, `beforeLoad`, `redirect`, `validateSearch`, `useSearch`, `errorComponent`). Check the installed version's typings before relying on anything newer.

## The route tree

- **Build the tree in code, in `App/Router/router.tsx`**: root, a pathless `app` layout route, then screens. Each route names its parent (`getParentRoute`), so a screen's place in the URL and the layout is read in one spot. Register the router type for typed `Link` and `navigate`.
- **Screens are imported by the tree; they do not import it.** A screen reads its params and search through the router hooks.
- **A route does not fetch.** A guard may call a ViewModel action; the data for a screen is requested by its ViewModel (`fe/skills/data-retrieval`).

## Guard on a pathless layout route

**Put every signed-in route under one pathless layout route (an `id`, no `path`) whose `beforeLoad` calls a guard that throws `redirect({ to: "/sign-in" })`.** Public routes (sign-in) sit beside it, not under it. Guards live in `App/Guards/`.

```ts
// App/Guards/requireSession.ts
export async function requireSession(location: { href: string }) {
	await useSessionViewModel.getState().fetchSession(); // shares the in-flight request
	if (useSessionViewModel.getState().user === null) {
		throw redirect({ to: "/sign-in", search: { redirect: location.href } });
	}
}
```

- `beforeLoad` runs before children load, so a signed-out visitor never starts a child's requests.
- **The guard asks the session ViewModel** ("who am I"), never a gateway: the session has one owner, and the 401 handler and the guard read the same state. A repeat navigation is answered from the store; only the first costs a request.
- Carry the target in the redirect and return the user there after sign-in. Validate it as a same-origin path before following it.
- Sign-in sends an already signed-in visitor on to the app; do the same check in reverse in its own `beforeLoad`.

## The guard is not the lock

It decides which screen to show. **Authorization is enforced by the backend on every request**, scoped to the user from the session cookie. A user must never reach another user's data by editing the URL: an id in a path is a request, and the backend answers 404 for what is not theirs. A 401 from any request clears the session ViewModel and goes to sign-in (`error-handling`).

## Search params are state

**Filters, search text, sort, pagination and date range live in the URL, validated by the route's `validateSearch` with a zod schema that supplies defaults.**

- The URL is shareable and survives reload and the back button. The ViewModel action takes the validated search object as its argument, so the screen and the address cannot disagree.
- Treat the query string as untrusted input: unknown or malformed values fall back to defaults rather than throwing.
- Update with `navigate({ search: (prev) => ({ ...prev, q }) })`; a changed filter resets `page` to 1.
- Keep text-box state local and debounce the write to the URL.
- Dates in the URL are ISO strings; convert to the user's zone at the edge, not inside the schema.

## Why

A guard in `beforeLoad` runs once per navigation in one place; a check inside each screen is the one somebody forgets. And because anything in a browser can be bypassed, the guard stays a convenience and the backend stays the authority.
