import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { STRUCTURED_DATA_MISSING_CHECK } from './structured-data-missing.check';

const withTypes = (types: string[]) =>
  makeCheckInput({ parsed: { jsonLd: { types, keywords: [] } } });

describe('STRUCTURED_DATA_MISSING', () => {
  it.each([['Article'], ['BlogPosting'], ['NewsArticle'], ['TechArticle']])(
    'passes on %s',
    (type) => {
      expect(STRUCTURED_DATA_MISSING_CHECK.evaluate(withTypes([type]))).toEqual(
        PASSES,
      );
    },
  );

  it('passes when an article type sits among others', () => {
    expect(
      STRUCTURED_DATA_MISSING_CHECK.evaluate(
        withTypes(['Organization', 'BreadcrumbList', 'Article']),
      ),
    ).toEqual(PASSES);
  });

  it('fails on a page declaring only Organization', () => {
    expect(
      STRUCTURED_DATA_MISSING_CHECK.evaluate(
        withTypes(['Organization', 'BreadcrumbList']),
      ),
    ).toEqual(failsWith({ types: ['Organization', 'BreadcrumbList'] }));
  });

  // Always applicable: "declares nothing" is the finding, not a reason to skip the check.
  it('fails on a page with no JSON-LD at all', () => {
    expect(STRUCTURED_DATA_MISSING_CHECK.evaluate(withTypes([]))).toEqual(
      failsWith({ types: [] }),
    );
  });
});
