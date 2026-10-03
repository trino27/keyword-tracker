import {
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../../_testing/expect-verdict';
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

    expect(CONTENT_RULES.IMAGES_MISSING_ALT(input)).toEqual(
      failsWith({ count: 2, total: 4, examples: ['a.png'] }),
    );
    expect(
      CONTENT_RULES.IMAGES_MISSING_ALT(
        makeRuleInput({ parsed: { images: [{ src: 'b.png', alt: '' }] } }),
      ),
    ).toEqual(PASSES);
  });

  // A page with no images has not passed an alt-text check; there was none to run.
  it('IMAGES_MISSING_ALT cannot be judged on a page with no images', () => {
    expect(
      CONTENT_RULES.IMAGES_MISSING_ALT(
        makeRuleInput({ parsed: { images: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it.each([
    [299, failsWith({ value: 299, min: 300 })],
    [300, PASSES],
  ])('THIN_CONTENT at %d words', (wordCount, expected) => {
    expect(
      CONTENT_RULES.THIN_CONTENT(makeRuleInput({ parsed: { wordCount } })),
    ).toEqual(expected);
  });

  it('THIN_CONTENT always applies, even to an empty page', () => {
    expect(
      CONTENT_RULES.THIN_CONTENT(makeRuleInput({ parsed: { wordCount: 0 } })),
    ).toEqual(failsWith({ value: 0, min: 300 }));
  });
});
