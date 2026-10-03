import type { TSeoRuleGroup } from '../../seo-rule.interface';
import { normalizeText } from '../../../text/normalize-text/normalize-text';

/** Runs after keyword selection; compares in the normalized form keywords are stored in. */
export const KEYWORD_RULES: TSeoRuleGroup<'KEYWORD_NOT_IN_TITLE'> = {
  KEYWORD_NOT_IN_TITLE: ({ parsed, topKeyword }) => {
    // No title is TITLE_MISSING's finding; no keyword means nothing to compare.
    if (parsed.title === null || topKeyword === null) return null;
    const title = ` ${normalizeText(parsed.title)} `;
    return title.includes(` ${topKeyword} `)
      ? null
      : { keyword: topKeyword, title: parsed.title };
  },
};
