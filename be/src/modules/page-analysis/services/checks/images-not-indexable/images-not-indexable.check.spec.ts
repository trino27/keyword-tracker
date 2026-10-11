import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { makeImage } from '../_testing/make-image';
import type { IPageImage } from '../../../interfaces/parsed-page.interface';
import { IMAGES_NOT_INDEXABLE_CHECK } from './images-not-indexable.check';

const verdict = (images: IPageImage[]) =>
  IMAGES_NOT_INDEXABLE_CHECK.evaluate(makeCheckInput({ parsed: { images } }));

describe('IMAGES_NOT_INDEXABLE', () => {
  it.each(['a.jpg', 'a.jpeg', 'a.png', 'a.webp', 'a.avif', 'a.svg', 'a.gif'])(
    'passes %s',
    (src) => {
      expect(verdict([makeImage({ src })])).toEqual(PASSES);
    },
  );

  it('passes an address without an extension', () => {
    expect(
      verdict([makeImage({ src: 'https://cdn.example/i/abc?w=800' })]),
    ).toEqual(PASSES);
  });

  it('passes an image with both src and srcset', () => {
    expect(
      verdict([makeImage({ src: 'a.jpg', srcset: 'a.jpg 1x, a@2x.jpg 2x' })]),
    ).toEqual(PASSES);
  });

  // A lazy-loading script sets src from data-src; Google renders and sees it.
  it('passes an image with neither src nor srcset', () => {
    expect(verdict([makeImage({ src: null, srcset: null })])).toEqual(PASSES);
  });

  it('fails srcset with no src fallback', () => {
    const result = verdict([
      makeImage({ src: null, srcset: 'a-800.jpg 800w, a-1600.jpg 1600w' }),
    ]);
    expect(result).toEqual(failsWith({ count: 1, total: 1 }));
    expect(evidenceOf(result)).toEqual([
      '<img srcset="a-800.jpg 800w, a-1600.jpg 1600w"> — srcset with no src fallback',
    ]);
  });

  it.each(['IMG_1234.HEIC', 'scan.tiff', 'photo.jxl'])(
    'fails %s, a format Google Images does not list',
    (src) => {
      expect(verdict([makeImage({ src }), makeImage()])).toEqual(
        failsWith({ count: 1, total: 2 }),
      );
    },
  );

  it('cannot be judged on a page with no images', () => {
    expect(verdict([])).toEqual(NOT_APPLICABLE);
  });
});
