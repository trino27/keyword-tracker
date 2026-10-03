import { failsWith, PASSES } from '../../_testing/expect-verdict';
import { makeRuleInput } from '../../_testing/make-rule-input';
import { STRUCTURED_DATA_RULES } from './structured-data-rules';

const withTypes = (types: string[]) =>
  makeRuleInput({ parsed: { jsonLd: { types, keywords: [] } } });

describe('STRUCTURED_DATA_RULES', () => {
  it.each([['Article'], ['BlogPosting'], ['NewsArticle'], ['TechArticle']])(
    'STRUCTURED_DATA_MISSING passes on %s',
    (type) => {
      expect(
        STRUCTURED_DATA_RULES.STRUCTURED_DATA_MISSING(withTypes([type])),
      ).toEqual(PASSES);
    },
  );

  it('passes when an article type sits among others', () => {
    expect(
      STRUCTURED_DATA_RULES.STRUCTURED_DATA_MISSING(
        withTypes(['Organization', 'BreadcrumbList', 'Article']),
      ),
    ).toEqual(PASSES);
  });

  it('fails on a page declaring only Organization', () => {
    expect(
      STRUCTURED_DATA_RULES.STRUCTURED_DATA_MISSING(
        withTypes(['Organization', 'BreadcrumbList']),
      ),
    ).toEqual(failsWith({ types: ['Organization', 'BreadcrumbList'] }));
  });

  // Always applicable: "declares nothing" is the finding, not a reason to skip the check.
  it('fails on a page with no JSON-LD at all', () => {
    expect(
      STRUCTURED_DATA_RULES.STRUCTURED_DATA_MISSING(withTypes([])),
    ).toEqual(failsWith({ types: [] }));
  });
});
