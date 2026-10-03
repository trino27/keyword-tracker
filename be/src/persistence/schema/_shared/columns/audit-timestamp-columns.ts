import { createdAtColumn } from './created-at-column';
import { updatedAtColumn } from './updated-at-column/updated-at-column';

/** `created_at` + `updated_at`, spread into a table: `...auditTimestampColumns()`. */
export const auditTimestampColumns = () => ({
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});
