import { failsWith, PASSES } from '../../_testing/expect-verdict';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { INDEXING_RULES } from './indexing-rules';

describe('INDEXING_RULES.NOINDEX', () => {
  it.each([
    [
      'noindex, follow',
      failsWith({ source: 'meta', value: 'noindex, follow' }),
    ],
    ['NONE', failsWith({ source: 'meta', value: 'NONE' })],
    ['index, follow', PASSES],
    ['max-snippet:-1, max-image-preview:large', PASSES],
  ])('meta robots %j', (metaRobots, expected) => {
    expect(
      INDEXING_RULES.NOINDEX(makeRuleInput({ parsed: { metaRobots } })),
    ).toEqual(expected);
  });

  it.each([
    ['noindex', failsWith({ source: 'header', value: 'noindex' })],
    [
      'googlebot: noindex',
      failsWith({ source: 'header', value: 'googlebot: noindex' }),
    ],
    ['noarchive', PASSES],
  ])('X-Robots-Tag %j', (value, expected) => {
    expect(
      INDEXING_RULES.NOINDEX(
        makeRuleInput({ headers: { 'x-robots-tag': value } }),
      ),
    ).toEqual(expected);
  });
});
