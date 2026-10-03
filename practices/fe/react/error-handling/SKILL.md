---
name: error-handling
description: Error handling in a React SPA with ViewModels. The ApiError class, one describeError helper in Core, expected vs unexpected failures, error boundaries per route, 401 to sign-in and 404 to a not-found state. Use when adding a screen or a request that can fail.
---

# Error Handling

## One error type, one sentence

- **`ApiError`** carries `status`, `errorCode` and `message`, built from any non-2xx answer by the gateway layer (`gateway-classes`). Branch on `errorCode` (stable); show `message` (for people).
- **`describeError(error): string` in `Core/Helpers/DescribeError/describeError.ts` is the only place that turns a failure into text.** An `ApiError` gives its message; a failed `fetch` gives "Could not reach the server"; a zod failure on a response gives a distinct "the server answered in a shape this app does not understand" text (a contract bug that no retry fixes, and a developer needs to see in the console). ViewModels call it in their `catch`; screens never build error strings by hand and never show a raw status or a stack trace.

## Expected and unexpected

| Kind | Examples | Handled by |
| --- | --- | --- |
| Expected | validation, duplicate client, not found, signed out | the place that asked: a field or form message, a not-found view, a redirect |
| Unexpected | a bug, backend down, schema drift | an error boundary with a retry, or the read's `error` state |

## Where each lands

Which component shows it is `fe/skills/error-display`. The routing of the failure:

- **401 anywhere**: the session ViewModel clears itself and the router goes to sign-in. Do it once, from one place (the transport's unauthorized handling feeding the session ViewModel), not per screen.
- **404 for a screen's own resource** (`/clients/42` that is not yours): a not-found view from that screen, or the router's not-found component. Not an error box.
- **A failed write (4xx)**: into the form or next to the control, stored as `actionError`; the screen stays (see `forms-and-validation`).
- **A failed read**: the ViewModel's `error`; the screen shows it with a retry that calls the same action.
- **Render errors and everything else**: an **error boundary per route** (the router's `errorComponent`) so one broken screen leaves the navigation intact, plus one at the root. It shows one sentence and a retry; it logs the original error.
- **Never swallow**: a `catch` that does nothing hides the failure from both the user and the console. Either handle it or rethrow. A superseded request is the one deliberate silence (`viewmodels-with-zustand`).

## Why

A single mapping point keeps the wording consistent and makes "the server answered nonsense" distinguishable from "the server is down" in the one place a developer will look.
