import { sql } from 'drizzle-orm';
import { CHECK_WEIGHTS } from '@app/contracts';

/**
 * A lateral subquery over `pages p`: `points_possible` and `points_lost`, the weighed
 * numerator and denominator of the page's score. The list orders by them and both the
 * list and the detail read them, so the order and the number on screen are one formula.
 *
 * Weighed at read time, by the catalogue as it is today, so changing a weight needs no
 * migration and no re-crawl. The weights travel as ONE jsonb parameter rather than a
 * VALUES list per statement.
 *
 * - `points_lost` counts only findings whose code is in `checks_judged`: a speed finding
 *   lives in the same table and never moves the score.
 * - A code the catalogue no longer knows weighs 1, so the denominator never shrinks
 *   below `checks_applicable` and a score is never divided by zero.
 * - A row whose crawl predates `checks_judged` cannot say WHICH checks applied, so it
 *   weighs every check as 1 — the counts it does have — until it is crawled again.
 */
export const SCORE_POINTS_LATERAL = sql`
  select
    case when p.checks_judged is null then p.checks_applicable
         else (select sum(coalesce((${JSON.stringify(CHECK_WEIGHTS)}::jsonb ->> j.code)::int, 1))
               from unnest(p.checks_judged) j(code))
    end as points_possible,
    case when p.checks_judged is null then p.checks_failed
         else (select coalesce(sum(coalesce((${JSON.stringify(CHECK_WEIGHTS)}::jsonb ->> i.code)::int, 1)), 0)
               from seo_issues i
               where i.page_id = p.id and i.code = any(p.checks_judged))
    end as points_lost
`;
