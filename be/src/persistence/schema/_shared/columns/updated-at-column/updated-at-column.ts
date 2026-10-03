import { timestamp } from 'drizzle-orm/pg-core';

/**
 * `updated_at timestamptz NOT NULL DEFAULT now()`, re-stamped by Drizzle on every
 * UPDATE it issues. A raw SQL update does not pass through `$onUpdate` and must
 * set the column itself.
 */
export const updatedAtColumn = () =>
  timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
