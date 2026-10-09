import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
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

  // Google obeys a meta tag addressed to it by name exactly as it obeys `robots`.
  it('reads <meta name="googlebot"> as well, and quotes the tag', () => {
    const verdict = NOINDEX_CHECK.evaluate(
      makeCheckInput({ parsed: { metaGooglebot: 'noindex' } }),
    );

    expect(verdict).toEqual(
      failsWith({ source: 'meta', name: 'googlebot', value: 'noindex' }),
    );
    expect(evidenceOf(verdict)).toEqual([
      '<meta name="googlebot" content="noindex">',
    ]);
  });

  it.each([
    ['noindex', failsWith({ source: 'header', value: 'noindex' })],
    [
      'googlebot: noindex',
      failsWith({ source: 'header', value: 'googlebot: noindex' }),
    ],
    ['noarchive', PASSES],
    // Addressed to another crawler: Google is not told anything.
    ['bingbot: noindex', PASSES],
    ['otherbot: noindex, nofollow', PASSES],
    // A rule taking a value is not a crawler's name.
    ['unavailable_after: 2030-01-01, noindex', failsWith({ source: 'header' })],
    ['bingbot: noarchive, googlebot: none', failsWith({ source: 'header' })],
  ])('X-Robots-Tag %j', (value, expected) => {
    expect(
      NOINDEX_CHECK.evaluate(
        makeCheckInput({ headers: { 'x-robots-tag': value } }),
      ),
    ).toEqual(expected);
  });

  it('quotes the header it read', () => {
    expect(
      evidenceOf(
        NOINDEX_CHECK.evaluate(
          makeCheckInput({ headers: { 'x-robots-tag': 'noindex' } }),
        ),
      ),
    ).toEqual(['X-Robots-Tag: noindex']);
  });

  // A date that has passed drops the page the same way, and the date may hold commas.
  it.each([
    'unavailable_after: 2026-01-31',
    'unavailable_after: Fri, 25 Sep 2026 15:00:00 GMT, noarchive',
  ])('fails %j once the date has passed', (metaRobots) => {
    const verdict = NOINDEX_CHECK.evaluate(
      makeCheckInput({ parsed: { metaRobots } }),
    );

    expect(verdict).toEqual(failsWith({ source: 'meta', value: metaRobots }));
    expect(evidenceOf(verdict)).toEqual([
      `<meta name="robots" content="${metaRobots}">`,
      'The page was fetched on 2026-10-09, after that date',
    ]);
  });

  it('passes an unavailable_after date still ahead, or one scoped to another crawler', () => {
    expect(
      NOINDEX_CHECK.evaluate(
        makeCheckInput({
          parsed: { metaRobots: 'unavailable_after: 2027-06-01' },
        }),
      ),
    ).toEqual(PASSES);
    expect(
      NOINDEX_CHECK.evaluate(
        makeCheckInput({
          headers: { 'x-robots-tag': 'bingbot: unavailable_after: 2020-01-01' },
        }),
      ),
    ).toEqual(PASSES);
  });
});
