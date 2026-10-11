import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { H1_LENGTH_CHECK } from './h1-length.check';

const withH1 = (text: string) =>
  makeCheckInput({
    parsed: { h1s: [text], headings: [{ level: 1, text }] },
  });

describe('H1_LENGTH', () => {
  it.each([
    [14, failsWith({ value: 14, min: 15, max: 70 })],
    [15, PASSES],
    [70, PASSES],
    [71, failsWith({ value: 71, min: 15, max: 70 })],
  ])('at %d characters', (length, expected) => {
    expect(H1_LENGTH_CHECK.evaluate(withH1('x'.repeat(length)))).toEqual(
      expected,
    );
  });

  it('counts characters, not UTF-16 units', () => {
    expect(H1_LENGTH_CHECK.evaluate(withH1('\u{1F642}'.repeat(15)))).toEqual(
      PASSES,
    );
  });

  // A logo wrapped in an <h1> sits before the post in the document; the post's heading
  // is the one in the content, and measuring the logo would report the site name.
  it("measures the content's h1, not a logo's earlier in the document", () => {
    const verdict = H1_LENGTH_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          h1s: ['Acme', 'How we cut our build time in half'],
          headings: [{ level: 1, text: 'How we cut our build time in half' }],
        },
      }),
    );

    expect(verdict).toEqual(PASSES);
  });

  it("falls back to the document's h1 when the content has none", () => {
    const verdict = H1_LENGTH_CHECK.evaluate(
      makeCheckInput({
        parsed: { h1s: ['Short'], headings: [{ level: 2, text: 'Intro' }] },
      }),
    );

    expect(verdict).toEqual(failsWith({ value: 5 }));
    expect(evidenceOf(verdict)).toEqual(['<h1>Short</h1>']);
  });

  // Not `pass`: a page with no h1 has escaped the rule, not satisfied it. H1_MISSING is
  // the check that fails it.
  it('cannot be judged without an h1', () => {
    expect(
      H1_LENGTH_CHECK.evaluate(
        makeCheckInput({
          parsed: { h1s: [], headings: [{ level: 2, text: 'Intro' }] },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
