import { bigserial } from 'drizzle-orm/pg-core';

/**
 * `id BIGSERIAL PRIMARY KEY`.
 *
 * `mode: 'number'`, deliberately: JS numbers are exact to 2^53, which a sequence
 * starting at 1 never reaches, and `bigint` would ripple through the API and the
 * frontend for no practical gain.
 *
 * A FRESH builder per call — Drizzle column builders are bound to a table when
 * the schema is assembled, and one instance shared by two tables corrupts both.
 */
export const primaryId = () => bigserial('id', { mode: 'number' }).primaryKey();
