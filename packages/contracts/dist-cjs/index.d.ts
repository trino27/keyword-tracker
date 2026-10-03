/**
 * `@app/contracts` — values and wire shapes that `be` and `fe` must agree on.
 *
 * The rule for what belongs here: the backend owns the value, the frontend
 * mirrors it, and a drift between the two would compile on both sides and fail
 * only at runtime. A constant the backend alone reads stays in `be/`.
 *
 * One entry point. Consumers import `@app/contracts` and nothing below it, so a
 * file can move inside `src/` without breaking either application.
 */
export * from './domain/http/api-prefix.constant.js';
export * from './domain/http/health-response.interface.js';
