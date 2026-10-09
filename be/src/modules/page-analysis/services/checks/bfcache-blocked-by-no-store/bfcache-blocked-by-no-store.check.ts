import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Cache-Control: no-store on the page itself, which browsers have treated as a reason to
 * keep it out of the back/forward cache. Always applicable: every response has or lacks
 * the directive.
 */
export const BFCACHE_BLOCKED_BY_NO_STORE_CHECK = defineCheck(
  'BFCACHE_BLOCKED_BY_NO_STORE',
  ({ headers }) => {
    const cacheControl = headers['cache-control'] ?? '';
    return /(^|[\s,])no-store($|[\s,])/i.test(cacheControl)
      ? fails({
          evidence: evidence([`Cache-Control: ${cacheControl}`]),
        })
      : PASS;
  },
);
