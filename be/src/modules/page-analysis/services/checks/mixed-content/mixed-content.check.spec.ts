import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { MIXED_CONTENT_CHECK } from './mixed-content.check';

const withResources = (...resourceUrls: string[]) =>
  makeCheckInput({ parsed: { resourceUrls } });

describe('MIXED_CONTENT', () => {
  it('passes a secure page whose resources are all secure', () => {
    expect(
      MIXED_CONTENT_CHECK.evaluate(
        withResources('https://a.example/i.png', 'https://cdn.example/x.js'),
      ),
    ).toEqual(PASSES);
  });

  it('counts the insecure ones and shows the first few', () => {
    expect(
      MIXED_CONTENT_CHECK.evaluate(
        withResources(
          'http://a.example/1.png',
          'https://a.example/ok.png',
          'http://a.example/2.js',
        ),
      ),
    ).toEqual(
      failsWith({
        count: 2,
        total: 3,
        examples: ['http://a.example/1.png', 'http://a.example/2.js'],
      }),
    );
  });

  it('cannot be judged on a page that is not served over HTTPS', () => {
    expect(
      MIXED_CONTENT_CHECK.evaluate(
        makeCheckInput({
          finalUrl: 'http://a.example/post/',
          parsed: { resourceUrls: ['http://a.example/1.png'] },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
