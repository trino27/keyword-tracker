import {
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../../_testing/expect-verdict';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { META_RULES } from './meta-rules';

describe('META_RULES', () => {
  it('META_DESCRIPTION_MISSING fires only without a description', () => {
    expect(
      META_RULES.META_DESCRIPTION_MISSING(
        makeRuleInput({ parsed: { metaDescription: null } }),
      ),
    ).toEqual(failsWith({}));
    expect(META_RULES.META_DESCRIPTION_MISSING(makeRuleInput())).toEqual(
      PASSES,
    );
  });

  it.each([
    [69, failsWith({ value: 69, min: 70, max: 160 })],
    [70, PASSES],
    [160, PASSES],
    [161, failsWith({ value: 161, min: 70, max: 160 })],
  ])('META_DESCRIPTION_LENGTH at %d characters', (length, expected) => {
    expect(
      META_RULES.META_DESCRIPTION_LENGTH(
        makeRuleInput({ parsed: { metaDescription: 'd'.repeat(length) } }),
      ),
    ).toEqual(expected);
  });

  it('META_DESCRIPTION_LENGTH cannot be judged without a description', () => {
    expect(
      META_RULES.META_DESCRIPTION_LENGTH(
        makeRuleInput({ parsed: { metaDescription: null } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('CANONICAL_MISSING and CANONICAL_MISMATCH', () => {
    expect(
      META_RULES.CANONICAL_MISSING(
        makeRuleInput({ parsed: { canonical: null } }),
      ),
    ).toEqual(failsWith({}));
    expect(
      META_RULES.CANONICAL_MISMATCH(
        makeRuleInput({ parsed: { canonical: 'https://a.example/post' } }),
      ),
    ).toEqual(PASSES);
    expect(
      META_RULES.CANONICAL_MISMATCH(
        makeRuleInput({ parsed: { canonical: 'https://a.example/other/' } }),
      ),
    ).toEqual(
      failsWith({
        canonical: 'https://a.example/other/',
        url: 'https://a.example/post/',
      }),
    );
  });

  it('CANONICAL_MISMATCH cannot be judged without a canonical', () => {
    expect(
      META_RULES.CANONICAL_MISMATCH(
        makeRuleInput({ parsed: { canonical: null } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('OG_TAGS_MISSING names the missing properties', () => {
    expect(
      META_RULES.OG_TAGS_MISSING(
        makeRuleInput({ parsed: { openGraph: { 'og:title': 'T' } } }),
      ),
    ).toEqual(failsWith({ missing: ['og:description', 'og:image'] }));
    expect(META_RULES.OG_TAGS_MISSING(makeRuleInput())).toEqual(PASSES);
  });

  it('LANG_MISSING', () => {
    expect(
      META_RULES.LANG_MISSING(makeRuleInput({ parsed: { lang: null } })),
    ).toEqual(failsWith({}));
    expect(META_RULES.LANG_MISSING(makeRuleInput())).toEqual(PASSES);
  });
});
