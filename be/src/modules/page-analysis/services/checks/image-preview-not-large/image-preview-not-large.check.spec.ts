import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { IMAGE_PREVIEW_NOT_LARGE_CHECK } from './image-preview-not-large.check';

const verdict = (
  metaRobots: string | null,
  headers: Record<string, string> = {},
  metaGooglebot: string | null = null,
) =>
  IMAGE_PREVIEW_NOT_LARGE_CHECK.evaluate(
    makeCheckInput({
      headers: { 'content-type': 'text/html', ...headers },
      parsed: { metaRobots, metaGooglebot },
    }),
  );

describe('IMAGE_PREVIEW_NOT_LARGE', () => {
  it('passes the rule Yoast SEO writes', () => {
    expect(
      verdict(
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      ),
    ).toEqual(PASSES);
  });

  it('passes the rule given in an X-Robots-Tag header', () => {
    expect(
      verdict(null, { 'x-robots-tag': 'max-image-preview:large' }),
    ).toEqual(PASSES);
  });

  // semrush.com's posts, 2026-10: a robots tag, and no preview rule in it.
  it('fails a robots tag that says nothing of the preview', () => {
    const result = verdict('index, follow');
    expect(result).toEqual(failsWith({ rule: null }));
    expect(evidenceOf(result)).toEqual([
      '<meta name="robots" content="index, follow"> — no max-image-preview',
    ]);
  });

  it('fails a page with no robots rule at all', () => {
    expect(evidenceOf(verdict(null))).toEqual([
      'No robots meta tag or X-Robots-Tag on the page',
    ]);
  });

  it.each(['max-image-preview:standard', 'max-image-preview:none'])(
    'fails %s',
    (rule) => {
      expect(verdict(rule)).toEqual(failsWith({ rule }));
    },
  );

  // The more restrictive of two rules applies.
  it('fails when googlebot caps the preview the robots tag allowed large', () => {
    expect(
      verdict('max-image-preview:large', {}, 'max-image-preview:standard'),
    ).toEqual(failsWith({ rule: 'max-image-preview:standard' }));
  });

  it('ignores a cap scoped to another crawler in the header', () => {
    expect(
      verdict('max-image-preview:large', {
        'x-robots-tag': 'bingbot: max-image-preview:none',
      }),
    ).toEqual(PASSES);
  });
});
