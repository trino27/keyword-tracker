import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_RELATIVE_CHECK } from './canonical-relative.check';

describe('CANONICAL_RELATIVE', () => {
  it('passes a canonical written as a full URL', () => {
    expect(CANONICAL_RELATIVE_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  it('fails one written as a path, quoting it as written', () => {
    const verdict = CANONICAL_RELATIVE_CHECK.evaluate(
      makeCheckInput({ parsed: { relativeCanonicals: ['/post/'] } }),
    );

    expect(verdict).toEqual(failsWith({ hrefs: ['/post/'] }));
    expect(evidenceOf(verdict)).toEqual([
      '<link rel="canonical" href="/post/"> — resolves against whatever host serves the page',
    ]);
  });

  it('cannot be judged without a canonical', () => {
    expect(
      CANONICAL_RELATIVE_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
