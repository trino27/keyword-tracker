import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import type { TSeoRuleGroup } from '../../seo-rule.interface';

const { min, max } = SEO_ISSUE_CATALOGUE.TITLE_LENGTH;

/** Length in characters as a reader counts them, not UTF-16 units. */
export const characterLength = (text: string) => [...text].length;

export const TITLE_RULES: TSeoRuleGroup<'TITLE_MISSING' | 'TITLE_LENGTH'> = {
  TITLE_MISSING: ({ parsed }) => (parsed.title === null ? {} : null),

  TITLE_LENGTH: ({ parsed }) => {
    if (parsed.title === null) return null;
    const length = characterLength(parsed.title);
    return length < min || length > max ? { length, min, max } : null;
  },
};
