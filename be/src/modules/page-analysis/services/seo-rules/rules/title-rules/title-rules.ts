import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import {
  fails,
  NOT_APPLICABLE,
  PASS,
  type TSeoRuleGroup,
} from '../../seo-rule.interface';

const { min, max } = SEO_ISSUE_CATALOGUE.TITLE_LENGTH;

/** Length in characters as a reader counts them, not UTF-16 units. */
export const characterLength = (text: string) => [...text].length;

export const TITLE_RULES: TSeoRuleGroup<'TITLE_MISSING' | 'TITLE_LENGTH'> = {
  TITLE_MISSING: ({ parsed }) => (parsed.title === null ? fails({}) : PASS),

  /** Not applicable without a title: there is nothing to measure, and TITLE_MISSING
   *  already says what is wrong. Passing here would reward the page for the absence. */
  TITLE_LENGTH: ({ parsed }) => {
    if (parsed.title === null) return NOT_APPLICABLE;
    const length = characterLength(parsed.title);
    return length < min || length > max
      ? fails({ value: length, min, max })
      : PASS;
  },
};
