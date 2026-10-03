import { timestamp } from 'drizzle-orm/pg-core';

/** `created_at timestamptz NOT NULL DEFAULT now()` — set once, on insert. */
export const createdAtColumn = () =>
  timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
