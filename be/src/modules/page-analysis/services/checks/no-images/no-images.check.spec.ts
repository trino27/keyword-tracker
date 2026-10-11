import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { NO_IMAGES_CHECK } from './no-images.check';

const imageless = (overrides: Parameters<typeof makeCheckInput>[0] = {}) =>
  makeCheckInput({
    ...overrides,
    parsed: { images: [], featuredImage: null, ...overrides.parsed },
  });

describe('NO_IMAGES', () => {
  it('passes a long post with an image in its content', () => {
    expect(NO_IMAGES_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  // A hero above the article is outside the content the extractor keeps.
  it('passes a post whose only image is its featured image', () => {
    expect(
      NO_IMAGES_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            images: [],
            featuredImage: {
              loading: null,
              markup: '<img src="https://a.example/hero.jpg">',
            },
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('fails a long post with no image, quoting the og:image it does not show', () => {
    const verdict = NO_IMAGES_CHECK.evaluate(imageless());

    expect(verdict).toEqual(failsWith({ words: 800 }));
    expect(evidenceOf(verdict)).toEqual([
      '800 words in the main content, and no <img> among them',
      '<meta property="og:image" content="https://a.example/i.png"> — not shown on the page',
    ]);
  });

  it('says so when the page declares no og:image either', () => {
    const verdict = NO_IMAGES_CHECK.evaluate(
      imageless({ parsed: { openGraph: { 'og:title': 'Link building' } } }),
    );

    expect(evidenceOf(verdict)).toContain(
      'No featured image either: the page declares no og:image',
    );
  });

  it.each([
    [299, NOT_APPLICABLE],
    [300, failsWith({ words: 300 })],
  ])('at %d words', (wordCount, expected) => {
    expect(
      NO_IMAGES_CHECK.evaluate(imageless({ parsed: { wordCount } })),
    ).toEqual(expected);
  });
});
