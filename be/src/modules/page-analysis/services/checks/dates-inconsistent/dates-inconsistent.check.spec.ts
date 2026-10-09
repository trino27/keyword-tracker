import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { DATES_INCONSISTENT_CHECK } from './dates-inconsistent.check';

const dated = (
  datePublished: string | null,
  dateModified: string | null = null,
  path = '/post/',
) =>
  makeCheckInput({
    finalUrl: `https://a.example${path}`,
    parsed: { datePublished, dateModified },
  });

describe('DATES_INCONSISTENT', () => {
  it('passes dates that agree with each other, the URL and the fetch', () => {
    expect(
      DATES_INCONSISTENT_CHECK.evaluate(
        dated('2026-01-10T09:00:00Z', '2026-02-01T09:00:00Z', '/2026/01/post/'),
      ),
    ).toEqual(PASSES);
  });

  it.each([
    [
      'modified before published',
      dated('2026-03-01', '2026-02-01'),
      'dateModified 2026-02-01 is earlier than datePublished 2026-03-01',
    ],
    [
      'published after the fetch',
      dated('2026-12-01'),
      'datePublished 2026-12-01 is after the page was fetched (2026-10-09)',
    ],
    [
      'a URL year the date does not share',
      dated('2024-05-02', null, '/2023/05/post/'),
      'The URL says 2023; datePublished says 2024 (2024-05-02)',
    ],
    [
      'a publication date that is no date',
      dated('last spring'),
      'datePublished "last spring" is not a date',
    ],
  ])('fails %s, quoting the contradiction', (_, page, quote) => {
    const verdict = DATES_INCONSISTENT_CHECK.evaluate(page);

    expect(verdict).toEqual(failsWith({}));
    expect(evidenceOf(verdict)).toEqual([quote]);
  });

  // East of UTC a date can be tomorrow in UTC and today where it was written.
  it('allows a day for a date written ahead of UTC', () => {
    expect(
      DATES_INCONSISTENT_CHECK.evaluate(dated('2026-10-10T01:00:00+05:00')),
    ).toEqual(PASSES);
  });

  // 00:30 on January 1 in Tashkent is still December 31 in UTC; the author meant 2024.
  it('reads the year as the author wrote it', () => {
    expect(
      DATES_INCONSISTENT_CHECK.evaluate(
        dated('2024-01-01T00:30:00+05:00', null, '/2024/01/post/'),
      ),
    ).toEqual(PASSES);
  });

  it('cannot be judged without a publication date', () => {
    expect(DATES_INCONSISTENT_CHECK.evaluate(dated(null))).toEqual(
      NOT_APPLICABLE,
    );
  });
});
