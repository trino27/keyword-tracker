import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_TO_HTTP_CHECK } from './canonical-to-http.check';

describe('CANONICAL_TO_HTTP', () => {
  it('fails an https page whose canonical is http://', () => {
    expect(
      CANONICAL_TO_HTTP_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: ['http://a.example/post/'] } }),
      ),
    ).toEqual(
      failsWith({ canonical: 'http://a.example/post/', source: 'head' }),
    );
  });

  it('reads a canonical declared only in the Link header', () => {
    expect(
      CANONICAL_TO_HTTP_CHECK.evaluate(
        makeCheckInput({
          headers: { link: '<http://a.example/post/>; rel="canonical"' },
          parsed: { canonicals: [] },
        }),
      ),
    ).toEqual(failsWith({ source: 'header' }));
  });

  it('passes an https canonical', () => {
    expect(CANONICAL_TO_HTTP_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  it('is not applicable on a page served over http', () => {
    expect(
      CANONICAL_TO_HTTP_CHECK.evaluate(
        makeCheckInput({
          finalUrl: 'http://a.example/post/',
          parsed: { canonicals: ['http://a.example/post/'] },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('is not applicable without a canonical', () => {
    expect(
      CANONICAL_TO_HTTP_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
