import { RECOMMENDED_ARTICLE_FIELDS } from '../../../constants/article-types.constant';
import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { STRUCTURED_DATA_INCOMPLETE_CHECK } from './structured-data-incomplete.check';

const article = (articleFields: string[]) =>
  makeCheckInput({
    parsed: { jsonLd: { types: ['BlogPosting'], keywords: [], articleFields } },
  });

describe('STRUCTURED_DATA_INCOMPLETE', () => {
  it('passes an article carrying every recommended field', () => {
    expect(
      STRUCTURED_DATA_INCOMPLETE_CHECK.evaluate(
        article([...RECOMMENDED_ARTICLE_FIELDS, 'articleBody']),
      ),
    ).toEqual(PASSES);
  });

  it('names the recommended fields the article does not carry', () => {
    expect(
      STRUCTURED_DATA_INCOMPLETE_CHECK.evaluate(
        article(['headline', 'image', 'datePublished']),
      ),
    ).toEqual(failsWith({ missing: ['dateModified', 'author', 'publisher'] }));
  });

  // The page with no article markup is already failing STRUCTURED_DATA_MISSING; telling
  // it the same thing twice is two findings about one defect.
  it('cannot be judged on a page with no article node', () => {
    expect(
      STRUCTURED_DATA_INCOMPLETE_CHECK.evaluate(
        makeCheckInput({
          parsed: {
            jsonLd: {
              types: ['Organization'],
              keywords: [],
              articleFields: [],
            },
          },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
