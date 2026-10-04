import { defineCheck, fails, PASS } from '../check.interface';

/** `noindex` or `none` in a robots directive list; a bot-specific prefix still counts. */
const NOINDEX = /(^|[\s,:])(noindex|none)(\s*,|\s*$)/i;

export const NOINDEX_CHECK = defineCheck('NOINDEX', ({ parsed, headers }) => {
  if (parsed.metaRobots && NOINDEX.test(parsed.metaRobots))
    return fails({ source: 'meta', value: parsed.metaRobots });
  const header = headers['x-robots-tag'];
  if (header && NOINDEX.test(header))
    return fails({ source: 'header', value: header });
  return PASS;
});
