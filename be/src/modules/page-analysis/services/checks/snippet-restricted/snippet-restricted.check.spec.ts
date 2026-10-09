import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { SNIPPET_RESTRICTED_CHECK } from './snippet-restricted.check';

describe('SNIPPET_RESTRICTED', () => {
  it.each([
    ['nosnippet', 'nosnippet'],
    ['index, follow, max-snippet: 0', 'max-snippet:0'],
  ])('fails robots meta %j, quoting the tag', (metaRobots, rule) => {
    const verdict = SNIPPET_RESTRICTED_CHECK.evaluate(
      makeCheckInput({ parsed: { metaRobots } }),
    );

    expect(verdict).toEqual(
      failsWith({ source: 'meta', name: 'robots', rule }),
    );
    expect(evidenceOf(verdict)).toEqual([
      `<meta name="robots" content="${metaRobots}">`,
    ]);
  });

  // A shorter snippet is an editorial choice; only a snippet of nothing is this finding.
  it.each(['max-snippet:50', 'max-snippet:-1', 'noarchive'])(
    'passes %j',
    (metaRobots) => {
      expect(
        SNIPPET_RESTRICTED_CHECK.evaluate(
          makeCheckInput({ parsed: { metaRobots } }),
        ),
      ).toEqual(PASSES);
    },
  );

  it('reads the header scoped to Google, and ignores one scoped to another crawler', () => {
    expect(
      SNIPPET_RESTRICTED_CHECK.evaluate(
        makeCheckInput({ headers: { 'x-robots-tag': 'googlebot: nosnippet' } }),
      ),
    ).toEqual(failsWith({ source: 'header', rule: 'nosnippet' }));
    expect(
      SNIPPET_RESTRICTED_CHECK.evaluate(
        makeCheckInput({ headers: { 'x-robots-tag': 'bingbot: nosnippet' } }),
      ),
    ).toEqual(PASSES);
  });
});
