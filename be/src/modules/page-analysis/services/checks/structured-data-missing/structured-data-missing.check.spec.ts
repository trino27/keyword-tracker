import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { extractPage } from '../../html-extraction/extract-page';
import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { STRUCTURED_DATA_MISSING_CHECK } from './structured-data-missing.check';

const withTypes = (types: string[]) =>
  makeCheckInput({
    parsed: { jsonLd: { types, keywords: [], articleFields: [] } },
  });

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

  /**
   * The whole path, from the recorded HTML to the verdict. Semrush's Article node has a
   * raw line break inside its `description`; Google's Rich Results Test reads the node,
   * so a check that reports "no article structured data" here is wrong about the page.
   */
  it('passes the recorded semrush post whose Article description spans two lines', () => {
    const url =
      'https://www.semrush.com/blog/seo-split-test-result-does-bolded-text-help-your-seo/';
    const parsed = extractPage(
      readFileSync(
        join(
          FIXTURES_ROOT,
          'sites/semrush/blog/seo-split-test-result-does-bolded-text-help-your-seo/index.html',
        ),
        'utf8',
      ),
      url,
    );

    expect(
      STRUCTURED_DATA_MISSING_CHECK.evaluate(
        makeCheckInput({ url, finalUrl: url, parsed }),
      ),
    ).toEqual(PASSES);
  });
});
