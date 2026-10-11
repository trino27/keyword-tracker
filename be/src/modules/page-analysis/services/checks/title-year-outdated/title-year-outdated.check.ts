import { todayInZone } from '@app/contracts';
import { evidence } from '../_shared/evidence';
import { titleWithoutBrand } from '../_shared/title-without-brand';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';
import {
  YEAR_PREPOSITIONS,
  YEAR_TRAILERS,
} from './title-year-outdated.constant';

/** A standalone year from 1900 to 2099, not part of a longer number or word. */
const YEAR = /(?<![\p{L}\p{N}])((?:19|20)\d{2})(?![\p{L}\p{N}])/gu;

const PRECEDED_BY_PREPOSITION = new RegExp(
  `(?:^|[^\\p{L}])(?:${YEAR_PREPOSITIONS.join('|')})\\s+$`,
  'iu',
);

/**
 * The years a title offers as its date: one that ends it, or one after "in", "for" or
 * "в". A year anywhere else — "2024 vs 2025: what changed" — is a subject, not a date.
 * Read in each part of the title without the site's name, so a brand like "Studio 2019"
 * is not read.
 */
function datedYears(title: string): number[] {
  return [...title.matchAll(YEAR)]
    .filter(({ index }) => {
      const before = title.slice(0, index);
      const after = title.slice(index + 4);
      return YEAR_TRAILERS.test(after) || PRECEDED_BY_PREPOSITION.test(before);
    })
    .map(([year]) => Number(year));
}

/**
 * A title that offers a past year as current: "Best SEO tools for 2025" read in 2026.
 * "This year" is the year in the owner's zone at the moment of the fetch (plan D18).
 * A historical title — "SEO in 2008" — also fires; the field audit decides whether that
 * is common enough to narrow the rule (plan O1).
 */
export const TITLE_YEAR_OUTDATED_CHECK = defineCheck(
  'TITLE_YEAR_OUTDATED',
  (page) => {
    const {
      parsed: { title },
      fetchedAt,
      timeZone,
    } = page;
    if (!title) return NOT_APPLICABLE;
    const currentYear = Number(todayInZone(fetchedAt, timeZone).slice(0, 4));
    const past = titleWithoutBrand(title, page)
      .flatMap(datedYears)
      .filter((year) => year < currentYear);
    if (past.length === 0) return PASS;
    const year = Math.max(...past);
    return fails({
      year,
      currentYear,
      evidence: evidence([
        `The title says ${year}; it is ${currentYear}.`,
        `<title>${title}</title>`,
      ]),
    });
  },
);
