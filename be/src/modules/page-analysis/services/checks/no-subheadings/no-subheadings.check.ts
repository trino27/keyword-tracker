import { evidence } from '../_shared/evidence';
import { isLongText } from '../_shared/long-text';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * Any heading below the title passes — an `<h3>` under the h1 included. Whether the
 * levels are in order is HEADING_SKIP's question; this one asks only whether a long text
 * is broken into sections at all.
 *
 * Not applicable to a short post, which reads fine as one block.
 */
export const NO_SUBHEADINGS_CHECK = defineCheck(
  'NO_SUBHEADINGS',
  ({ parsed }) => {
    if (!isLongText(parsed)) return NOT_APPLICABLE;
    if (parsed.headings.some(({ level }) => level > 1)) return PASS;
    return fails({
      words: parsed.wordCount,
      evidence: evidence([
        `${parsed.wordCount} words in the main content, under no <h2>–<h6>`,
      ]),
    });
  },
);
