import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** A calendar date alone: `2026-10-03`. The time is optional, Google says. */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A date and time of day, with or without a zone after it. */
const DATE_TIME =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}(?::\d{2}(?:[.,]\d+)?)?)(Z|[+-]\d{2}(?::?\d{2})?)?$/i;

/** Why a declared date is not what Google asks for, or null when it is. */
function problemOf(value: string): string | null {
  const date = DATE_ONLY.test(value) ? value : DATE_TIME.exec(value)?.[1];
  if (!date || Number.isNaN(Date.parse(`${date}T00:00:00Z`)))
    return 'not an ISO 8601 date';
  const time = DATE_TIME.exec(value);
  if (time && !time[3]) return 'a time of day with no time zone';
  return null;
}

/**
 * The article markup's datePublished and dateModified, as written, against Google's
 * "ISO 8601 format, with timezone". A date without a time passes: the date is required
 * and the time is not.
 */
export const ARTICLE_DATE_FORMAT_INVALID_CHECK = defineCheck(
  'ARTICLE_DATE_FORMAT_INVALID',
  ({ parsed }) => {
    const markup = parsed.articleMarkup;
    const dates = (
      [
        ['datePublished', markup?.datePublished ?? null],
        ['dateModified', markup?.dateModified ?? null],
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
