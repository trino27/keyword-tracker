import { failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { REDIRECTED_CHECK } from './redirected.check';

describe('REDIRECTED', () => {
  it('reports both ends', () => {
    expect(
      REDIRECTED_CHECK.evaluate(
        makeCheckInput({
          url: 'https://a.example/old/',
          finalUrl: 'https://a.example/new/',
          redirected: true,
        }),
      ),
    ).toEqual(
      failsWith({
        from: 'https://a.example/old/',
        to: 'https://a.example/new/',
      }),
    );
    expect(REDIRECTED_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });
});
