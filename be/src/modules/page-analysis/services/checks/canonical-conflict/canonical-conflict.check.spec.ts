import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_CONFLICT_CHECK } from './canonical-conflict.check';

const OWN = 'https://a.example/post/';
const OTHER = 'https://a.example/other/';

describe('CANONICAL_CONFLICT', () => {
  it('passes one canonical, however many places repeat it', () => {
    expect(CANONICAL_CONFLICT_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
    expect(
      CANONICAL_CONFLICT_CHECK.evaluate(
        makeCheckInput({ headers: { link: `<${OWN}>; rel="canonical"` } }),
      ),
    ).toEqual(PASSES);
  });

  it('fails two different canonicals in <head>, quoting both tags', () => {
    const verdict = CANONICAL_CONFLICT_CHECK.evaluate(
      makeCheckInput({ parsed: { canonicals: [OWN, OTHER] } }),
    );

    expect(verdict).toEqual(failsWith({ canonicals: [OWN, OTHER] }));
    expect(evidenceOf(verdict)).toEqual([
      `<link rel="canonical" href="${OWN}">`,
      `<link rel="canonical" href="${OTHER}">`,
    ]);
  });

  // A theme writes the tag and the CDN the header; neither knows about the other.
  it('fails a tag and a Link header that disagree', () => {
    const verdict = CANONICAL_CONFLICT_CHECK.evaluate(
      makeCheckInput({ headers: { link: `<${OTHER}>; rel=canonical` } }),
    );

    expect(verdict).toEqual(failsWith({ canonicals: [OWN, OTHER] }));
    expect(evidenceOf(verdict)).toContain(`Link: <${OTHER}>; rel="canonical"`);
  });

  it('cannot be judged without a canonical', () => {
    expect(
      CANONICAL_CONFLICT_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
