import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { characterLength } from '../_shared/character-length';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const { min, max } = SEO_ISSUE_CATALOGUE.H1_LENGTH;

/**
 * The post's own heading: the first `<h1>` of the main content, falling back to the
 * document's first only when the content has none. The other way round, a theme that
 * wraps its logo in an `<h1>` would have the site name measured as the post's heading.
 *
 * Not applicable without an h1: there is nothing to measure, and H1_MISSING already says
 * what is wrong. Several h1s are H1_MULTIPLE's to report; this measures the one that
 * names the post.
 */
export const H1_LENGTH_CHECK = defineCheck('H1_LENGTH', ({ parsed }) => {
  const heading =
    parsed.headings.find(({ level }) => level === 1)?.text ?? parsed.h1s.at(0);
  if (heading === undefined) return NOT_APPLICABLE;
  const length = characterLength(heading);
  return length < min || length > max
    ? fails({
        value: length,
        min,
        max,
        evidence: evidence([`<h1>${heading}</h1>`]),
      })
    : PASS;
});
