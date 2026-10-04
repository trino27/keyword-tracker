import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_MISMATCH_CHECK } from './canonical-mismatch.check';

describe('CANONICAL_MISMATCH', () => {
  it('ignores a trailing slash', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { canonical: 'https://a.example/post' } }),
      ),
    ).toEqual(PASSES);
  });

  it('names both URLs when they disagree', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { canonical: 'https://a.example/other/' } }),
      ),
    ).toEqual(
      failsWith({
        canonical: 'https://a.example/other/',
        url: 'https://a.example/post/',
      }),
    );
  });

  it('cannot be judged without a canonical', () => {
    expect(
      CANONICAL_MISMATCH_CHECK.evaluate(
        makeCheckInput({ parsed: { canonical: null } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
