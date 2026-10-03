import type { TSeoRuleGroup } from '../../seo-rule.interface';

/** `noindex` or `none` in a robots directive list; a bot-specific prefix still counts. */
const NOINDEX = /(^|[\s,:])(noindex|none)(\s*,|\s*$)/i;

export const INDEXING_RULES: TSeoRuleGroup<'NOINDEX'> = {
  NOINDEX: ({ parsed, headers }) => {
    if (parsed.metaRobots && NOINDEX.test(parsed.metaRobots))
      return { source: 'meta', value: parsed.metaRobots };
    const header = headers['x-robots-tag'];
    if (header && NOINDEX.test(header))
      return { source: 'header', value: header };
    return null;
  },
};
