---
name: forms-and-validation
description: Forms in a React SPA with ViewModel state. Where form state lives, a zod schema validated on submit, mapping backend 400 and 409 answers to fields or a form message, submit state. Use when adding or changing a form.
---

# Forms and Validation

- **Where the state lives.** Pure input that nothing else needs (the text in a box, which field is focused) is local component state: one `useState` object typed `z.input<typeof schema>`. State that an action or another component reads (a draft that survives navigation, the submit status, the server's refusal) lives in the ViewModel. Do not mirror one into the other.
- **One zod schema per form, validated on submit** (and on blur for fields the user has left), beside the form as `<Form>Schema.ts`. Typing never shows an error for a field the user has not finished.
  ```ts
  const addClientSchema = z.object({
  	name: z.string().trim().min(1, "Enter a name"),
  	url: z.url("Enter a full address, e.g. https://example.com"),
  });
  const result = addClientSchema.safeParse(values);
  if (!result.success) return setErrors(z.flattenError(result.error).fieldErrors);
  await addClient(result.data);
  ```
- **The submit action receives the parsed data**, not the raw state, so trimming and coercion are applied once.
- **Client validation is a courtesy; the backend validates again and wins.** Never skip a backend rule because the form checks it.
- **Map the backend answer, do not just print it.**
  | Answer | Shows |
  | --- | --- |
  | 400 with a field-level message | under that field if the name is known, else the form message |
  | 409 (already exists) | the form message, or the field that conflicts |
  | 401 | nothing here: the session handler goes to sign-in |
  | 5xx / network | the form message from `describeError`, keep the input |

  `ApiError.errorCode` is the stable thing to branch on; `message` is the sentence to show. The ViewModel stores a refusal in `actionError` (not in the read `error`), and the form renders it (`fe/skills/error-display`).
- **Submit state comes from the ViewModel** (`status: "submitting"`): disable the button meanwhile, never clear the inputs on failure, reset them on success, and move the user on (navigate or close). A second submit while one is in flight is ignored by the action, not only by the disabled button.
- **Every input has a visible label** associated with it (`htmlFor` / wrapping `<label>`), and an error is linked with `aria-describedby` and announced (`role="alert"` or `aria-live`).
- **Font size of inputs is at least 16px** on touch devices, or iOS zooms on focus.

## Why

Validating on submit keeps the form quiet while the user types and gives one place to show errors; mapping the backend's answer to a field is what separates "that address is already added" from a generic red banner.
