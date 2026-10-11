import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { META_DESCRIPTION_MISSING_CHECK } from './meta-description-missing.check';

describe('META_DESCRIPTION_MISSING', () => {
  it('fires only without a description', () => {
    expect(
      META_DESCRIPTION_MISSING_CHECK.evaluate(
        makeCheckInput({
          parsed: { metaDescription: null, metaDescriptionGap: 'absent' },
        }),
      ),
    ).toEqual(failsWith({}));
    expect(META_DESCRIPTION_MISSING_CHECK.evaluate(makeCheckInput())).toEqual(
      PASSES,
    );
  });

  /** troyhunt.com: `content=""` is there; "no tag in the document" sent the reader looking for one. */
  it.each([
    ['absent', 'No <meta name="description"> in the document'],
    ['empty', 'the tag is there, with no text'],
    ['outsideHead', 'outside <head>, where Google does not read it'],
  ] as const)('says what the source shows when the tag is %s', (gap, line) => {
    const verdict = META_DESCRIPTION_MISSING_CHECK.evaluate(
      makeCheckInput({
        parsed: { metaDescription: null, metaDescriptionGap: gap },
      }),
    );

    expect(JSON.stringify(verdict)).toContain(
      JSON.stringify(line).slice(1, -1),
    );
  });
});
