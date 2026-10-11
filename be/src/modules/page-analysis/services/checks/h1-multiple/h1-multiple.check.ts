import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Two or more DIFFERENT main headings. One heading written twice — moz.com renders the
 * post's title as two <h1>s, one for phones and one for wider screens, and CSS hides one
 * at every width — still names one subject, so copies with the same words count once.
 */
export const H1_MULTIPLE_CHECK = defineCheck('H1_MULTIPLE', ({ parsed }) => {
  const distinct = [
    ...new Map(parsed.h1s.map((text) => [text.toLowerCase(), text])).values(),
  ];
  return distinct.length > 1
    ? fails({
        count: distinct.length,
        evidence: evidence(distinct.map((text) => `<h1>${text}</h1>`)),
      })
    : PASS;
});
