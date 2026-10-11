import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { OG_TAGS_MISSING_CHECK } from './og-tags-missing.check';

describe('OG_TAGS_MISSING', () => {
  it('names the missing properties', () => {
    expect(
      OG_TAGS_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: { openGraph: { 'og:title': 'T' }, shareImage: null },
        }),
      ),
    ).toEqual(failsWith({ missing: ['og:description', 'og:image'] }));
    expect(OG_TAGS_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  /** vercel.com's docs: the protocol calls og:image:url "Identical to og:image". */
  it('takes og:image:url as the share image', () => {
    expect(
      OG_TAGS_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            openGraph: {
              'og:title': 'Flags',
              'og:description': 'Feature flags',
              'og:image:url': 'https://vercel.com/api/docs-og?title=Flags',
            },
            shareImage: 'https://vercel.com/api/docs-og?title=Flags',
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  /** smashingmagazine.com: a tag that is there and names nothing a card can fetch. */
  it('fails an og:image that is not a full address, and says so beside it', () => {
    const verdict = OG_TAGS_MISSING_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          openGraph: {
            'og:title': 'Issue 579',
            'og:description': 'The newsletter',
            'og:image': 'https:',
            'og:image:width': '1200',
          },
          shareImage: 'https:',
        },
      }),
    );

    expect(verdict).toEqual(failsWith({ missing: ['og:image'] }));
    expect(evidenceOf(verdict)).toContain(
      '<meta property="og:image" content="https:"> — not a full image address, so no card shows it',
    );
    expect(evidenceOf(verdict)).toContain(
      '<meta property="og:image:width" content="1200"> — present',
    );
  });
});
