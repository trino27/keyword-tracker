/**
 * Every table, as one object — what Drizzle's relational query API is typed by.
 *
 * A table that is not spread in here still migrates (drizzle-kit reads the
 * `*.schema.ts` glob) but is invisible to `db.query.*`.
 */
export const databaseSchema = {};

export type DatabaseSchema = typeof databaseSchema;
