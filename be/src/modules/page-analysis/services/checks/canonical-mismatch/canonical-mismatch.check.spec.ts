import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_MISMATCH_CHECK } from './canonical-mismatch.check';

describe('CANONICAL_MISMATCH', () => {
  it('ignores a trailing slash', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: ['https://a.example/post'] } }),
      ),
    ).toEqual(PASSES);
  });

  it('names both URLs when they disagree', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: { canonicals: ['https://a.example/other/'] },
        }),
      ),
    ).toEqual(
      failsWith({
        canonical: 'https://a.example/other/',
        url: 'https://a.example/post/',
      }),
    );
  });

  // The page's own http:// twin is CANONICAL_TO_HTTP's finding, not a second one here.
  it("is not applicable to the page's http twin — CANONICAL_TO_HTTP's", () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: ['http://a.example/post/'] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  // Plan D34: a broken target is the more specific finding; one fact, one finding.
  it("is not applicable when the target is broken — that is CANONICAL_TARGET_BROKEN's", () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: { canonicals: ['https://a.example/other/'] },
          linkStatuses: {
            links: new Map(),
            documents: new Map([
              [
                'https://a.example/other/',
                {
                  url: 'https://a.example/other/',
                  outcome: {
                    kind: 'answered',
                    status: 404,
                    redirects: [],
                    finalUrl: 'https://a.example/other/',
                  },
                  page: null,
                },
              ],
            ]),
          },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  // The budget never hides the canonical: an unread target leaves the mismatch reported.
  it('judges as before when the target was not read', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({
          parsed: { canonicals: ['https://a.example/other/'] },
        }),
      ),
    ).toEqual(failsWith({ canonical: 'https://a.example/other/' }));
  });

  it('cannot be judged without a canonical', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
