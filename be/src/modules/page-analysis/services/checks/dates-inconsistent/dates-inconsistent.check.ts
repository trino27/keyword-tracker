import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A day of slack on "in the future": a date written in a zone east of UTC can be
 * tomorrow in UTC while it is today where it was written.
 */
const FUTURE_SLACK_MS = 24 * 60 * 60 * 1000;

/** A path segment that is a plausible year, as blogs put it: /2023/10/slug/. */
const YEAR_SEGMENT = /\/((?:19|20)\d{2})\//;

/**
 * The year the date names, read from the text when it starts with one, so a date
 * written as 2024-01-01T00:30+05:00 is 2024 — as its author wrote it — and not the
 * 2023 its UTC instant falls in.
 */
const yearOf = (value: string, instant: number) =>
  /^(\d{4})-/.exec(value)?.[1] ?? String(new Date(instant).getUTCFullYear());

/**
 * Dates on one page that cannot all be true: modified before published, published after
 * the page was fetched, or a year in the URL that the publication date does not share.
 * Each contradiction is quoted; a page can have several.
 *
 * Not applicable without a publication date: there is nothing to contradict.
 */
export const DATES_INCONSISTENT_CHECK = defineCheck(
  'DATES_INCONSISTENT',
  ({ parsed, finalUrl, fetchedAt }) => {
    const { datePublished, dateModified } = parsed;
    if (!datePublished) return NOT_APPLICABLE;
    const published = Date.parse(datePublished);
    const contradictions: string[] = [];
    if (Number.isNaN(published)) {
      contradictions.push(`datePublished "${datePublished}" is not a date`);
    } else {
      const modified = dateModified ? Date.parse(dateModified) : NaN;
      if (!Number.isNaN(modified) && modified < published)
        contradictions.push(
          `dateModified ${dateModified} is earlier than datePublished ${datePublished}`,
        );
      if (published > fetchedAt.getTime() + FUTURE_SLACK_MS)
        contradictions.push(
          `datePublished ${datePublished} is after the page was fetched (${fetchedAt.toISOString().slice(0, 10)})`,
        );
      const urlYear = YEAR_SEGMENT.exec(new URL(finalUrl).pathname)?.[1];
      const year = yearOf(datePublished, published);
      if (urlYear && urlYear !== year)
        contradictions.push(
          `The URL says ${urlYear}; datePublished says ${year} (${datePublished})`,
        );
    }
    return contradictions.length === 0
      ? PASS
      : fails({
          datePublished,
          dateModified,
          evidence: evidence(contradictions),
        });
  },
);
