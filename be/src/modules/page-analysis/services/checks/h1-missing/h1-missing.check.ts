import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * Any `<h1>` in the body passes. Without one, the heading the content does start with is
 * quoted: it is usually the post's title, marked up one level too low.
 */
export const H1_MISSING_CHECK = defineCheck('H1_MISSING', ({ parsed }) => {
  if (parsed.h1s.length > 0) return PASS;
  const [first] = parsed.headings;
  return fails({
    evidence: evidence([
      'No <h1> anywhere in <body>',
      first
        ? `The content's first heading: <h${first.level}>${first.text}</h${first.level}>`
        : 'The main content has no headings at all',
    ]),
  });
});
