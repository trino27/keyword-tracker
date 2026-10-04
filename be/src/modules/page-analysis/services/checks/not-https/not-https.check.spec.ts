import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { NOT_HTTPS_CHECK } from './not-https.check';

describe('NOT_HTTPS', () => {
  it('judges where the request ended', () => {
    expect(
      NOT_HTTPS_CHECK.evaluate(
        makeCheckInput({ finalUrl: 'http://a.example/post/' }),
      ),
    ).toEqual(failsWith({ url: 'http://a.example/post/' }));
    expect(NOT_HTTPS_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });
});
