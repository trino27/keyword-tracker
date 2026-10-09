import { duplicatesOf, type TValueOf } from '../_shared/duplicates-of';
import { evidence } from '../_shared/evidence';
import { defineRunCheck } from '../check.interface';

/** A page's top keyword - the one subject it is shown as being about. */
const topKeyword: TValueOf = (input, index) =>
  input.keywords[index]?.[0]?.term ?? null;

/**
 * Two posts written for one query take each other's links and rankings. The Semrush
 * fixtures carry a real example: "What is AI marketing?" and "AI Marketing Guide" both
 * come back with `ai marketing` first.
 */
export const KEYWORD_CANNIBALISATION_CHECK = defineRunCheck(
  'KEYWORD_CANNIBALISATION',
  (input) =>
    duplicatesOf(input, topKeyword, (term, others) => ({
      term,
      otherUrls: others,
      evidence: evidence([
        `"${term}" is the top keyword here and on ${others.length} other page${others.length === 1 ? '' : 's'} of this crawl`,
      ]),
    })),
);
