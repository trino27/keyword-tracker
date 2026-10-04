import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { characterLength } from '../_shared/character-length';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const { min, max } = SEO_ISSUE_CATALOGUE.META_DESCRIPTION_LENGTH;

/** Nothing to measure without a description; META_DESCRIPTION_MISSING says the rest. */
export const META_DESCRIPTION_LENGTH_CHECK = defineCheck(
  'META_DESCRIPTION_LENGTH',
  ({ parsed }) => {
    if (parsed.metaDescription === null) return NOT_APPLICABLE;
    const length = characterLength(parsed.metaDescription);
    return length < min || length > max
      ? fails({ value: length, min, max })
      : PASS;
  },
);
