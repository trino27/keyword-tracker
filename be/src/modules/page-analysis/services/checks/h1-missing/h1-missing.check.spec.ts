import { evidenceOf, failsWith, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { H1_MISSING_CHECK } from './h1-missing.check';

describe('H1_MISSING', () => {
  it.each([
    [[], failsWith({})],
    [['One'], PASSES],
    [['One', 'Two'], PASSES],
  ])('h1s %j', (h1s, expected) => {
    expect(
      H1_MISSING_CHECK.evaluate(makeCheckInput({ parsed: { h1s } })),
    ).toEqual(expected);
  });

  // Usually the post's title, marked up one level too low.
  it('quotes the heading the content starts with instead', () => {
    const verdict = H1_MISSING_CHECK.evaluate(
      makeCheckInput({
        parsed: { h1s: [], headings: [{ level: 2, text: 'The real title' }] },
      }),
    );

    expect(evidenceOf(verdict)).toEqual([
      'No <h1> anywhere in <body>',
      "The content's first heading: <h2>The real title</h2>",
    ]);
  });
});
