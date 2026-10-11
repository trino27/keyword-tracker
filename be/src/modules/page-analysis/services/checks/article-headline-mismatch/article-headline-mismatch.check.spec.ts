import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { ARTICLE_HEADLINE_MISMATCH_CHECK } from './article-headline-mismatch.check';

const verdict = (
  headline: string | null,
  title: string | null = 'AI Marketing Guide: Tools + Use Cases for Marketers',
  h1s: string[] = ['AI Marketing Guide: Tools and Use Cases'],
) =>
  ARTICLE_HEADLINE_MISMATCH_CHECK.evaluate(
    makeCheckInput({
      parsed: {
        title,
        h1s,
        articleMarkup: {
          ...makeCheckInput().parsed.articleMarkup!,
          headline,
        },
      },
    }),
  );

describe('ARTICLE_HEADLINE_MISMATCH', () => {
  it('passes the post title as the headline', () => {
    expect(
      verdict('AI Marketing Guide: Tools + Use Cases for Marketers'),
    ).toEqual(PASSES);
  });

  it('passes a shortened headline', () => {
    expect(verdict('AI Marketing Guide')).toEqual(PASSES);
  });

  it('passes a headline that matches the h1 alone', () => {
    expect(
      verdict('Tools and Use Cases', 'Acme Blog', ['Tools and use cases']),
    ).toEqual(PASSES);
  });

  it('passes Chinese text, split into words', () => {
    expect(verdict('人工智能营销指南', '人工智能营销指南 - 博客', [])).toEqual(
      PASSES,
    );
  });

  it("fails a template's site name in every headline", () => {
    const result = verdict('Acme Corporation Blog');
    expect(result).toEqual(
      failsWith({ headline: 'Acme Corporation Blog', shared: 0 }),
    );
    expect(evidenceOf(result)[0]).toBe('headline: "Acme Corporation Blog"');
  });

  it('cannot be judged without a headline or anything to compare it with', () => {
    expect(verdict(null)).toEqual(NOT_APPLICABLE);
    expect(verdict('A headline', null, [])).toEqual(NOT_APPLICABLE);
  });
});
