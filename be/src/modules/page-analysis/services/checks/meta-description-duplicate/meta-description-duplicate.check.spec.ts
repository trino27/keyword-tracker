import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeRunInput, runPage } from '../_testing/make-run-input';
import { META_DESCRIPTION_DUPLICATE_CHECK } from './meta-description-duplicate.check';

const described = (path: string, metaDescription: string | null) =>
  runPage(path, { parsed: { metaDescription } });

describe('META_DESCRIPTION_DUPLICATE', () => {
  it('flags a description two pages share', () => {
    const run = makeRunInput([
      described('a', 'The agency blog.'),
      described('b', 'The agency blog.'),
      described('c', 'A description of its own.'),
    ]);

    expect(META_DESCRIPTION_DUPLICATE_CHECK.evaluate(run)).toEqual([
      failsWith({ otherUrls: ['https://a.example/b/'] }),
      failsWith({ otherUrls: ['https://a.example/a/'] }),
      PASSES,
    ]);
  });

  it('cannot be judged on a page with no description', () => {
    const run = makeRunInput([described('a', null), described('b', 'Text.')]);

    expect(META_DESCRIPTION_DUPLICATE_CHECK.evaluate(run)[0]).toEqual(
      NOT_APPLICABLE,
    );
  });

  it('cannot be judged on a run of one page', () => {
    expect(
      META_DESCRIPTION_DUPLICATE_CHECK.evaluate(
        makeRunInput([described('only', 'Text.')]),
      ),
    ).toEqual([NOT_APPLICABLE]);
  });
});
