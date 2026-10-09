import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { DATE_BUMPED_WITHOUT_CHANGES_CHECK } from './date-bumped-without-changes.check';

const SAME = 'a'.repeat(64);
const crawledAt = new Date('2026-09-01T12:00:00Z');

const comparing = (
  previous: { contentHash: string | null; dateModified: string | null } | null,
  now: { contentHash?: string; dateModified?: string | null } = {},
) =>
  makeCheckInput({
    previous: previous && { ...previous, crawledAt },
    parsed: {
      contentHash: now.contentHash ?? SAME,
      dateModified:
        now.dateModified === undefined
          ? '2026-10-01T09:00:00Z'
          : now.dateModified,
    },
  });

describe('DATE_BUMPED_WITHOUT_CHANGES', () => {
  it('fails a date that moved over the same words, quoting both dates', () => {
    const verdict = DATE_BUMPED_WITHOUT_CHANGES_CHECK.evaluate(
      comparing({ contentHash: SAME, dateModified: '2026-08-01T09:00:00Z' }),
    );

    expect(verdict).toEqual(
      failsWith({
        before: '2026-08-01T09:00:00Z',
        after: '2026-10-01T09:00:00Z',
      }),
    );
    expect(evidenceOf(verdict)).toEqual([
      'dateModified at the crawl of 2026-09-01: 2026-08-01T09:00:00Z',
      'dateModified now: 2026-10-01T09:00:00Z',
      'Main content: word for word the same (identical SHA-256 of the text)',
    ]);
  });

  it('passes a new date over new words, and the same date over the same words', () => {
    expect(
      DATE_BUMPED_WITHOUT_CHANGES_CHECK.evaluate(
        comparing(
          { contentHash: SAME, dateModified: '2026-08-01T09:00:00Z' },
          { contentHash: 'b'.repeat(64) },
        ),
      ),
    ).toEqual(PASSES);
    expect(
      DATE_BUMPED_WITHOUT_CHANGES_CHECK.evaluate(
        comparing({ contentHash: SAME, dateModified: '2026-10-01T09:00:00Z' }),
      ),
    ).toEqual(PASSES);
  });

  it.each([
    ['the first crawl of the page', null, {}],
    [
      'a crawl from before fingerprints were kept',
      { contentHash: null, dateModified: '2026-08-01T09:00:00Z' },
      {},
    ],
    [
      'a page that declares no date',
      { contentHash: SAME, dateModified: '2026-08-01T09:00:00Z' },
      { dateModified: null },
    ],
  ] as const)('cannot be judged on %s', (_, previous, now) => {
    expect(
      DATE_BUMPED_WITHOUT_CHANGES_CHECK.evaluate(comparing(previous, now)),
    ).toEqual(NOT_APPLICABLE);
  });
});
