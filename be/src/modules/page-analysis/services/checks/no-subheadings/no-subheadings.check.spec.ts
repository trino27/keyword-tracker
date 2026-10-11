import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { NO_SUBHEADINGS_CHECK } from './no-subheadings.check';

const TITLE = { level: 1, text: 'A complete guide to link building' } as const;

describe('NO_SUBHEADINGS', () => {
  it('passes a long post with an h2', () => {
    expect(NO_SUBHEADINGS_CHECK.evaluate(makeCheckInput())).toEqual(PASSES);
  });

  // The order of levels is HEADING_SKIP's question, not this one's.
  it('passes sections under h3s alone', () => {
    expect(
      NO_SUBHEADINGS_CHECK.evaluate(
        makeCheckInput({
          parsed: { headings: [TITLE, { level: 3, text: 'Step one' }] },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('fails a long post under its title alone, quoting its length', () => {
    const verdict = NO_SUBHEADINGS_CHECK.evaluate(
      makeCheckInput({ parsed: { headings: [TITLE], wordCount: 1_200 } }),
    );

    expect(verdict).toEqual(failsWith({ words: 1_200 }));
    expect(evidenceOf(verdict)).toEqual([
      '1200 words in the main content, under no <h2>–<h6>',
    ]);
  });

  it('fails a long post with no headings at all', () => {
    expect(
      NO_SUBHEADINGS_CHECK.evaluate(
        makeCheckInput({ parsed: { headings: [] } }),
      ),
    ).toEqual(failsWith({ words: 800 }));
  });

  // The line is THIN_CONTENT's: 299 words is a short post, 300 a long one.
  it.each([
    [299, NOT_APPLICABLE],
    [300, failsWith({ words: 300 })],
  ])('at %d words', (wordCount, expected) => {
    expect(
      NO_SUBHEADINGS_CHECK.evaluate(
        makeCheckInput({ parsed: { headings: [TITLE], wordCount } }),
      ),
    ).toEqual(expected);
  });
});
