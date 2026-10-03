import { makeRuleInput } from '../../_testing/make-rule-input';
import { META_RULES } from './meta-rules';

describe('META_RULES', () => {
  it('META_DESCRIPTION_MISSING fires only without a description', () => {
    expect(
      META_RULES.META_DESCRIPTION_MISSING(
        makeRuleInput({ parsed: { metaDescription: null } }),
      ),
    ).toEqual({});
    expect(META_RULES.META_DESCRIPTION_MISSING(makeRuleInput())).toBeNull();
  });

  it.each([
    [69, { length: 69, min: 70, max: 160 }],
    [70, null],
    [160, null],
    [161, { length: 161, min: 70, max: 160 }],
  ])('META_DESCRIPTION_LENGTH at %d characters', (length, expected) => {
    expect(
      META_RULES.META_DESCRIPTION_LENGTH(
        makeRuleInput({ parsed: { metaDescription: 'd'.repeat(length) } }),
      ),
    ).toEqual(expected);
  });

  it('CANONICAL_MISSING and CANONICAL_MISMATCH', () => {
    expect(
      META_RULES.CANONICAL_MISSING(
        makeRuleInput({ parsed: { canonical: null } }),
      ),
    ).toEqual({});
    expect(
      META_RULES.CANONICAL_MISMATCH(
        makeRuleInput({ parsed: { canonical: 'https://a.example/post' } }),
      ),
    ).toBeNull();
    expect(
      META_RULES.CANONICAL_MISMATCH(
        makeRuleInput({ parsed: { canonical: 'https://a.example/other/' } }),
      ),
    ).toEqual({
      canonical: 'https://a.example/other/',
      url: 'https://a.example/post/',
    });
  });

  it('OG_TAGS_MISSING names the missing properties', () => {
    expect(
      META_RULES.OG_TAGS_MISSING(
        makeRuleInput({ parsed: { openGraph: { 'og:title': 'T' } } }),
      ),
    ).toEqual({ missing: ['og:description', 'og:image'] });
    expect(META_RULES.OG_TAGS_MISSING(makeRuleInput())).toBeNull();
  });

  it('LANG_MISSING', () => {
    expect(
      META_RULES.LANG_MISSING(makeRuleInput({ parsed: { lang: null } })),
    ).toEqual({});
    expect(META_RULES.LANG_MISSING(makeRuleInput())).toBeNull();
  });
});
