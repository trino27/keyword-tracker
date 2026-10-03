import { makeRuleInput } from '../../_testing/make-rule-input';
import { CONTENT_RULES } from './content-rules';

describe('CONTENT_RULES', () => {
  it('IMAGES_MISSING_ALT counts absent alts; alt="" is deliberate', () => {
    const input = makeRuleInput({
      parsed: {
        images: [
          { src: 'a.png', alt: null },
          { src: 'b.png', alt: '' },
          { src: 'c.png', alt: 'Chart' },
          { src: null, alt: null },
        ],
      },
    });

    expect(CONTENT_RULES.IMAGES_MISSING_ALT(input)).toEqual({
      count: 2,
      total: 4,
      examples: ['a.png'],
    });
    expect(
      CONTENT_RULES.IMAGES_MISSING_ALT(
        makeRuleInput({ parsed: { images: [{ src: 'b.png', alt: '' }] } }),
      ),
    ).toBeNull();
  });

  it.each([
    [299, { words: 299, min: 300 }],
    [300, null],
  ])('THIN_CONTENT at %d words', (wordCount, expected) => {
    expect(
      CONTENT_RULES.THIN_CONTENT(makeRuleInput({ parsed: { wordCount } })),
    ).toEqual(expected);
  });
});
