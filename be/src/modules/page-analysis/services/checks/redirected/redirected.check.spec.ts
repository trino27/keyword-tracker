import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { REDIRECTED_CHECK } from './redirected.check';

const redirectedVia = (...redirects: { url: string; status: number }[]) =>
  makeCheckInput({
    url: 'https://a.example/old/',
    finalUrl: 'https://a.example/new/',
    redirected: true,
    redirects,
  });

describe('REDIRECTED', () => {
  it('reports both ends', () => {
    expect(
      REDIRECTED_CHECK.evaluate(
        redirectedVia({ url: 'https://a.example/old/', status: 301 }),
      ),
    ).toEqual(
      failsWith({
        from: 'https://a.example/old/',
        to: 'https://a.example/new/',
        temporary: false,
      }),
    );
    expect(REDIRECTED_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  // The status is half the finding: Google keeps showing the source of a 302.
  it('quotes every hop with its status, and says when one is temporary', () => {
    const verdict = REDIRECTED_CHECK.evaluate(
      redirectedVia(
        { url: 'https://a.example/old/', status: 302 },
        { url: 'https://a.example/middle/', status: 301 },
      ),
    );

    expect(verdict).toEqual(failsWith({ temporary: true }));
    expect(evidenceOf(verdict)).toEqual([
      '302 https://a.example/old/ → https://a.example/middle/',
      '301 https://a.example/middle/ → https://a.example/new/',
    ]);
  });
});
