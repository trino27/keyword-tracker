import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { NOINDEX_CHECK } from './noindex.check';

describe('NOINDEX', () => {
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
      NOINDEX_CHECK.evaluate(makeCheckInput({ parsed: { metaRobots } })),
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
      NOINDEX_CHECK.evaluate(
        makeCheckInput({ headers: { 'x-robots-tag': value } }),
      ),
    ).toEqual(expected);
  });
});
