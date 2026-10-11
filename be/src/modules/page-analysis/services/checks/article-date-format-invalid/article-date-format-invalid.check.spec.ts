import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { ARTICLE_DATE_FORMAT_INVALID_CHECK } from './article-date-format-invalid.check';

const verdict = (
  datePublished: string | null,
  dateModified: string | null = null,
) =>
  ARTICLE_DATE_FORMAT_INVALID_CHECK.evaluate(
    makeCheckInput({ parsed: { datePublished, dateModified } }),
  );

describe('ARTICLE_DATE_FORMAT_INVALID', () => {
  it.each([
    '2026-10-11T12:45:09+03:00',
    '2019-01-24T11:17:59+00:00',
    '2024-11-08T11:34:00Z',
    '2024-11-08T11:34:00.123Z',
    '2024-11-08T11:34+0300',
    // The date is required, the time is not.
    '2026-10-03',
  ])('passes %s', (date) => {
    expect(verdict(date)).toEqual(PASSES);
  });

  it.each([
    ['October 3, 2026', 'not an ISO 8601 date'],
    ['03/10/2026', 'not an ISO 8601 date'],
    ['2026-13-45', 'not an ISO 8601 date'],
    ['2026-10-03 09:00:00', 'not an ISO 8601 date'],
    ['2026-10-03T09:00:00', 'a time of day with no time zone'],
  ])('fails %s: %s', (date, problem) => {
    const result = verdict(date);
    expect(result).toEqual(failsWith({ fields: ['datePublished'] }));
    expect(evidenceOf(result)).toEqual([
      `datePublished: "${date}" — ${problem}`,
    ]);
  });

  it('judges dateModified as well', () => {
    expect(verdict('2026-10-03', '2026-10-05T10:00')).toEqual(
      failsWith({ fields: ['dateModified'] }),
    );
  });

  it('cannot be judged without a declared date', () => {
    expect(verdict(null, null)).toEqual(NOT_APPLICABLE);
  });
});
