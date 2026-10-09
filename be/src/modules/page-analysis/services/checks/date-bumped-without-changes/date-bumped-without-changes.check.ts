import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The declared modification date moved since the client's previous crawl, and the main
 * content's fingerprint did not. Both halves are needed: a new date over new words is an
 * update, and the same words under the same date is a page nobody touched.
 *
 * The fingerprint is of the text after furniture is removed, so a theme whose widget
 * column changes between crawls can only make a page look EDITED — which this check
 * then lets pass. It can miss a bumped date; it cannot invent one.
 *
 * Not applicable without an earlier crawl that recorded both a fingerprint and a date,
 * or without a date now.
 */
export const DATE_BUMPED_WITHOUT_CHANGES_CHECK = defineCheck(
  'DATE_BUMPED_WITHOUT_CHANGES',
  ({ parsed, previous }) => {
    if (
      !previous?.contentHash ||
      !previous.dateModified ||
      !parsed.dateModified
    )
      return NOT_APPLICABLE;
    if (
      previous.contentHash !== parsed.contentHash ||
      previous.dateModified === parsed.dateModified
    )
      return PASS;
    const day = previous.crawledAt.toISOString().slice(0, 10);
    return fails({
      before: previous.dateModified,
      after: parsed.dateModified,
      evidence: evidence([
        `dateModified at the crawl of ${day}: ${previous.dateModified}`,
        `dateModified now: ${parsed.dateModified}`,
        'Main content: word for word the same (identical SHA-256 of the text)',
      ]),
    });
  },
);
