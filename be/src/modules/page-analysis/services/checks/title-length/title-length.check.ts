import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { characterLength } from '../_shared/character-length';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const { min, max } = SEO_ISSUE_CATALOGUE.TITLE_LENGTH;

/**
 * Not applicable without a title: there is nothing to measure, and TITLE_MISSING already
 * says what is wrong. Passing here would reward the page for the absence.
 */
export const TITLE_LENGTH_CHECK = defineCheck('TITLE_LENGTH', ({ parsed }) => {
  if (parsed.title === null) return NOT_APPLICABLE;
  const length = characterLength(parsed.title);
  return length < min || length > max
    ? fails({
        value: length,
        min,
        max,
        evidence: evidence([`<title>${parsed.title}</title>`]),
      })
    : PASS;
});
