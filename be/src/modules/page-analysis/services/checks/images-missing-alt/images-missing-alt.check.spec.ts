import { makeImage } from '../_testing/make-image';
import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { IMAGES_MISSING_ALT_CHECK } from './images-missing-alt.check';

describe('IMAGES_MISSING_ALT', () => {
  it('counts absent alts; an empty alt is deliberate', () => {
    const input = makeCheckInput({
      parsed: {
        images: [
          makeImage({ src: 'a.png', alt: null }),
          makeImage({ src: 'b.png', alt: '' }),
          makeImage({ src: 'c.png', alt: 'Chart' }),
          makeImage({ src: null, alt: null }),
        ],
      },
    });

    expect(IMAGES_MISSING_ALT_CHECK.evaluate(input)).toEqual(
      failsWith({ count: 2, total: 4, examples: ['a.png'] }),
    );
    expect(
      IMAGES_MISSING_ALT_CHECK.evaluate(
        makeCheckInput({
          parsed: { images: [makeImage({ src: 'b.png', alt: '' })] },
        }),
      ),
    ).toEqual(PASSES);
  });

  // A page with no images has not passed an alt-text check; there was none to run.
  it('cannot be judged on a page with no images', () => {
    expect(
      IMAGES_MISSING_ALT_CHECK.evaluate(
        makeCheckInput({ parsed: { images: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
