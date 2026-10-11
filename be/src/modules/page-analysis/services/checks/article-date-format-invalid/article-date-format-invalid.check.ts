import { evidence } from '../_shared/evidence';
import { readIsoDate } from '../_shared/iso-date';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Why a declared date is not what Google asks for, or null when it is. */
function problemOf(value: string): string | null {
  const date = readIsoDate(value);
  if (!date) return 'not an ISO 8601 date';
  if (date.hasTime && !date.hasZone)
    return "a time of day with no time zone — valid ISO 8601, but Google then reads it in Googlebot's own zone";
  return null;
}

/**
 * The article's declared datePublished and dateModified, as written, against Google's
 * "ISO 8601 format, with timezone". A date without a time passes: the date is required
 * and the time is not.
 */
export const ARTICLE_DATE_FORMAT_INVALID_CHECK = defineCheck(
  'ARTICLE_DATE_FORMAT_INVALID',
  ({ parsed }) => {
    // The values DATES_INCONSISTENT compares — JSON-LD, then article:* meta, then
    // Microdata — so the one finds a date's form wrong and the other its content.
    const dates = (
      [
        ['datePublished', parsed.datePublished],
        ['dateModified', parsed.dateModified],
      ] as [string, string | null][]
    ).filter((entry): entry is [string, string] => entry[1] !== null);
    if (dates.length === 0) return NOT_APPLICABLE;
    const invalid = dates.flatMap(([field, value]) => {
      const problem = problemOf(value);
      return problem ? [{ field, value, problem }] : [];
    });
    return invalid.length === 0
      ? PASS
      : fails({
          fields: invalid.map(({ field }) => field),
          evidence: evidence(
            invalid.map(
              ({ field, value, problem }) =>
                `${field}: "${value}" — ${problem}`,
            ),
          ),
        });
  },
);
