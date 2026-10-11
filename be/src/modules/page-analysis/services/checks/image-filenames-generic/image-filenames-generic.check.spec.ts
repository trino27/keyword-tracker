import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { makeImage } from '../_testing/make-image';
import { IMAGE_FILENAMES_GENERIC_CHECK } from './image-filenames-generic.check';

const verdict = (...srcs: (string | null)[]) =>
  IMAGE_FILENAMES_GENERIC_CHECK.evaluate(
    makeCheckInput({
      parsed: { images: srcs.map((src) => makeImage({ src })) },
    }),
  );

describe('IMAGE_FILENAMES_GENERIC', () => {
  it.each([
    'my-new-black-kitten.jpg',
    'Gluten-Free-Honey-Cake-15-683x1024.jpg',
    'seo_basics_http_2_fi.jpg',
    // Hashed names a platform generates are not the author's to change.
    '0eaj912cjwerzxuv6eo0w8fli03l8xpx.jpg',
    // A bare number is a platform id: moz.com's /user/photo/10.jpg (2026-10).
    'https://moz.com/images/user/photo/10.jpg?w=160',
    'imagination-1024x768.png',
    // An image optimizer names the file in its url parameter (vercel.com, backlinko.com).
    '/_next/image?url=https%3A%2F%2Fx.public.blob.vercel-storage.com%2Fflags-tab-light.png&w=3840&q=75',
    'https://backlinko.com/_next/image?url=%2Fapp%2Fuploads%2Fchapters-1-the-voice-search-revolution-1.png&w=1080',
  ])('passes %s', (src) => {
    expect(verdict(src)).toEqual(PASSES);
  });

  it.each([
    // Recorded live, 2026-10: joelonsoftware.com, copyblogger.com, smashing, cossa.ru.
    'https://i0.wp.com/www.joelonsoftware.com/wp-content/uploads/2022/12/IMG_0203.webp?resize=730%2C730',
    'Screen-Shot-2023-06-19-at-9.54.58-AM-700x371.png',
    'image-3-700x476.png',
    'https://files.smashing.media/authors/download%20%2850%29.jpg',
    '/upload/medialibrary/92a/0eaj912cjwerzxuv6eo0w8fli03l8xpx/image2.jpg',
    'DSC01234.JPG',
    'PXL_20260101_101010123.jpg',
    'untitled.png',
    'Снимок экрана 2026-10-11 в 12.00.00.png',
    '/_next/image?url=%2Fuploads%2FIMG_1234.jpg&w=640&q=75',
  ])('fails %s', (src) => {
    expect(verdict(src)).toEqual(failsWith({ count: 1, total: 1 }));
  });

  it('quotes the image and its file name', () => {
    expect(evidenceOf(verdict('/u/IMG_1234.jpg', 'kitten.jpg'))).toEqual([
      '<img src="/u/IMG_1234.jpg"> — IMG_1234.jpg',
    ]);
  });

  it('reads the srcset when src is a placeholder', () => {
    const result = IMAGE_FILENAMES_GENERIC_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          images: [
            makeImage({
              src: 'data:image/gif;base64,R0lGOD',
              srcset: 'IMG_9999-800x600.jpg 800w',
            }),
          ],
        },
      }),
    );
    expect(result).toEqual(failsWith({ count: 1 }));
  });

  it('cannot be judged without a named image', () => {
    expect(verdict()).toEqual(NOT_APPLICABLE);
    expect(verdict('data:image/png;base64,iVBOR')).toEqual(NOT_APPLICABLE);
  });
});
