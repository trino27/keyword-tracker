import { makeRuleInput } from '../../_testing/make-rule-input';
import { INDEXING_RULES } from './indexing-rules';

describe('INDEXING_RULES.NOINDEX', () => {
  it.each([
    ['noindex, follow', { source: 'meta', value: 'noindex, follow' }],
    ['NONE', { source: 'meta', value: 'NONE' }],
    ['index, follow', null],
    ['max-snippet:-1, max-image-preview:large', null],
  ])('meta robots %j', (metaRobots, expected) => {
    expect(
      INDEXING_RULES.NOINDEX(makeRuleInput({ parsed: { metaRobots } })),
    ).toEqual(expected);
  });

  it.each([
    ['noindex', { source: 'header', value: 'noindex' }],
    ['googlebot: noindex', { source: 'header', value: 'googlebot: noindex' }],
    ['noarchive', null],
  ])('X-Robots-Tag %j', (value, expected) => {
    expect(
      INDEXING_RULES.NOINDEX(
        makeRuleInput({ headers: { 'x-robots-tag': value } }),
      ),
    ).toEqual(expected);
  });
});
