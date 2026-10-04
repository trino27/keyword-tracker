import type { IHeading } from '../../../interfaces/parsed-page.interface';
import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { HEADING_SKIP_CHECK } from './heading-skip.check';

const outline = (...levels: IHeading['level'][]) =>
  makeCheckInput({
    parsed: { headings: levels.map((level) => ({ level, text: `H${level}` })) },
  });

describe('HEADING_SKIP', () => {
  it('reports the first jump of more than one level', () => {
    expect(HEADING_SKIP_CHECK.evaluate(outline(1, 2, 4, 6))).toEqual(
      failsWith({ from: 'h2', to: 'h4', heading: 'H4' }),
    );
  });

  it('allows going back up and one level down', () => {
    expect(HEADING_SKIP_CHECK.evaluate(outline(1, 2, 3, 2, 3, 1, 2))).toEqual(
      PASSES,
    );
  });

  // One heading is no outline. Judging it passed would reward a page for having nothing
  // to get wrong, which is the opposite of what an outline check is for.
  it.each([[[]], [[1 as const]]])(
    'cannot be judged on %j headings',
    (levels) => {
      expect(HEADING_SKIP_CHECK.evaluate(outline(...levels))).toEqual(
        NOT_APPLICABLE,
      );
    },
  );
});
