import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

const MAX_ELEMENTS = SEO_ISSUE_CATALOGUE.DOM_SIZE_LARGE.max;

/**
 * Elements in the HTML as served, against Lighthouse's line for an excessive DOM. On the
 * recorded posts two of forty-three pass it (yoast, 1,655 and 2,487); the rest sit
 * between 632 and 1,273. Scripts may add more, which this count cannot see.
 */
export const DOM_SIZE_LARGE_CHECK = defineCheck(
  'DOM_SIZE_LARGE',
  ({ parsed }) =>
    parsed.elementCount > MAX_ELEMENTS
      ? fails({
          value: parsed.elementCount,
          max: MAX_ELEMENTS,
          evidence: evidence([
            `${parsed.elementCount.toLocaleString('en-US')} elements in the HTML as served`,
          ]),
        })
      : PASS,
);
