import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { PREVIEW_IMAGE_IS_LOGO_CHECK } from './preview-image-is-logo.check';

const verdict = (
  ogImage: string | null,
  logos: string[] = ['https://a.example/brand/acme.png'],
  markupImage: string | null = null,
) =>
  PREVIEW_IMAGE_IS_LOGO_CHECK.evaluate(
    makeCheckInput({
      parsed: {
        openGraph: ogImage ? { 'og:image': ogImage } : {},
        logos,
        articleMarkup: markupImage
          ? {
              source: 'json-ld',
              type: 'BlogPosting',
              headline: 'A post',
              datePublished: null,
              dateModified: null,
              authors: [],
              images: [{ url: markupImage, width: null, height: null }],
            }
          : null,
      },
    }),
  );

describe('PREVIEW_IMAGE_IS_LOGO', () => {
  it('passes a picture of the post', () => {
    expect(verdict('https://a.example/uploads/kitten.jpg')).toEqual(PASSES);
  });

  it('passes a post about a logo, its file named so', () => {
    expect(verdict('https://a.example/new-logo-reveal-2026.jpg')).toEqual(
      PASSES,
    );
  });

  it('fails og:image that is the logo the structured data declares', () => {
    const result = verdict('https://A.example/brand/acme.png?v=2');
    expect(result).toEqual(failsWith({ count: 1 }));
    expect(evidenceOf(result)).toEqual([
      'og:image https://A.example/brand/acme.png?v=2 — the logo the structured data declares',
    ]);
  });

  it.each(['logo.png', 'site-logo.svg', 'acme_logo_dark.png'])(
    'fails a file named as a logo: %s',
    (file) => {
      expect(verdict(`https://a.example/${file}`, [])).toEqual(
        failsWith({ count: 1 }),
      );
    },
  );

  it('reads the article markup image too', () => {
    expect(
      verdict(null, [], 'https://a.example/wp-content/logo-1200x630.png'),
    ).toEqual(failsWith({ count: 1 }));
  });

  it('cannot be judged on a page naming no image', () => {
    expect(verdict(null)).toEqual(NOT_APPLICABLE);
  });
});
