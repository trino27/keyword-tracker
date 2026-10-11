import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import type { IPreviewImage } from '../../../interfaces/parsed-page.interface';
import { PREVIEW_IMAGE_TOO_SMALL_CHECK } from './preview-image-too-small.check';

const URL = 'https://a.example/hero.jpg';

const verdict = (previewImage: IPreviewImage | null) =>
  PREVIEW_IMAGE_TOO_SMALL_CHECK.evaluate(makeCheckInput({ previewImage }));

describe('PREVIEW_IMAGE_TOO_SMALL', () => {
  it('passes an image 1,200 px wide', () => {
    expect(
      verdict({ url: URL, status: 200, width: 1200, height: 628 }),
    ).toEqual(PASSES);
  });

  // minimalistbaker.com names a resized portrait copy as og:image (2026-10).
  it('fails an image narrower than 1,200 px, with its measured size', () => {
    const result = verdict({ url: URL, status: 200, width: 683, height: 1024 });
    expect(result).toEqual(failsWith({ value: 683, min: 1200 }));
    expect(evidenceOf(result)).toEqual([
      `${URL} — 683×1024 px, read from the file`,
    ]);
  });

  it('cannot be judged without a measured image', () => {
    expect(verdict(null)).toEqual(NOT_APPLICABLE);
    expect(
      verdict({ url: URL, status: 404, width: null, height: null }),
    ).toEqual(NOT_APPLICABLE);
    expect(
      verdict({ url: URL, status: 200, width: null, height: null }),
    ).toEqual(NOT_APPLICABLE);
  });

  // A small logo is PREVIEW_IMAGE_IS_LOGO's finding; the size would say it twice.
  it('leaves the site logo to PREVIEW_IMAGE_IS_LOGO', () => {
    expect(
      PREVIEW_IMAGE_TOO_SMALL_CHECK.evaluate(
        makeCheckInput({
          previewImage: {
            url: 'https://a.example/brand/logo.png',
            status: 200,
            width: 400,
            height: 400,
          },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
