import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { LARGE_PAGE_CHECK } from './large-page.check';

describe('LARGE_PAGE', () => {
  it.each([
    [1_048_576, PASSES],
    [1_048_577, failsWith({ value: 1_048_577, max: 1_048_576 })],
  ])('at %d bytes', (htmlBytes, expected) => {
    expect(LARGE_PAGE_CHECK.evaluate(makeCheckInput({ htmlBytes }))).toEqual(
      expected,
    );
  });

  /** smashingmagazine.com's author archive: 2.6 MB, so its end is never indexed. */
  it('says when the page is already past what Googlebot reads', () => {
    expect(
      evidenceOf(
        LARGE_PAGE_CHECK.evaluate(makeCheckInput({ htmlBytes: 2_633_754 })),
      ),
    ).toEqual([
      '2,633,754 bytes of HTML, decompressed — past the 2,097,152 Googlebot reads: the last 536,602 bytes are not indexed',
    ]);
    expect(
      evidenceOf(
        LARGE_PAGE_CHECK.evaluate(makeCheckInput({ htmlBytes: 1_291_165 })),
      ),
    ).toEqual([
      '1,291,165 bytes of HTML, decompressed — Googlebot stops reading at 2,097,152',
    ]);
  });
});
