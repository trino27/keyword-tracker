import { sql } from 'drizzle-orm';
import { CURRENT_CRAWL_RUN_STATUSES } from '@app/contracts';

/**
 * `succeeded, partial` as SQL — the statuses that make a run a client's CURRENT one. One
 * fragment for every read that asks "is this page current?": the list, the detail, the
 * report and the PageSpeed claim must agree, or the worker measures pages the screens no
 * longer show.
 */
export const CURRENT_RUN_STATUSES_SQL = sql.join(
  CURRENT_CRAWL_RUN_STATUSES.map((status) => sql`${status}`),
  sql`, `,
);
