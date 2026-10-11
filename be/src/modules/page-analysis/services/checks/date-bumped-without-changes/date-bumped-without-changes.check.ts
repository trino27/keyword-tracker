import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The longest `dateModified` a crawl stores. A longer one is kept cut, so it is compared
 * cut: otherwise every re-crawl of an untouched page would read as a new date.
 */
const STORED_DATE_WIDTH = 64;

/**
 * Whether two declared dates name the same moment. `2026-02-01T09:00:00Z` and
 * `2026-02-01T09:00:00+00:00` are one date written two ways — a plugin update can switch
 * the spelling — and a page whose words did not change was not re-dated by it.
 */
function sameDate(before: string, now: string): boolean {
  const cut = now.slice(0, STORED_DATE_WIDTH);
  if (before === cut) return true;
  const [a, b] = [Date.parse(before), Date.parse(now)];
  return !Number.isNaN(a) && a === b;
}

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
      sameDate(previous.dateModified, parsed.dateModified)
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
