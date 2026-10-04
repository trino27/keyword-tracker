import { failsWith, NOT_APPLICABLE, PASSES } from '../_testing/expect-verdict';
import { makeRunInput, runPage } from '../_testing/make-run-input';
import { TITLE_DUPLICATE_CHECK } from './title-duplicate.check';

const titled = (path: string, title: string | null) =>
  runPage(path, { parsed: { title } });

describe('TITLE_DUPLICATE', () => {
  it('flags a title two pages share', () => {
    const run = makeRunInput([
      titled('a', 'Link building in 2026'),
      titled('b', 'Link building in 2026'),
      titled('c', 'Something else entirely'),
    ]);

    expect(TITLE_DUPLICATE_CHECK.evaluate(run)).toEqual([
      failsWith({ otherUrls: ['https://a.example/b/'] }),
      failsWith({ otherUrls: ['https://a.example/a/'] }),
      PASSES,
    ]);
  });

  // Compared as the reader sees them: case and runs of whitespace are not a difference
  // a search result would show.
  it('compares titles as the reader sees them', () => {
    const run = makeRunInput([
      titled('a', 'Link  Building'),
      titled('b', 'link building'),
    ]);

    expect(TITLE_DUPLICATE_CHECK.evaluate(run)).toEqual([
      failsWith({ otherUrls: ['https://a.example/b/'] }),
      failsWith({ otherUrls: ['https://a.example/a/'] }),
    ]);
  });

  it('cannot be judged on a page with no title', () => {
    const run = makeRunInput([titled('a', null), titled('b', 'A title')]);

    expect(TITLE_DUPLICATE_CHECK.evaluate(run)[0]).toEqual(NOT_APPLICABLE);
  });

  it('cannot be judged on a run of one page', () => {
    expect(
      TITLE_DUPLICATE_CHECK.evaluate(makeRunInput([titled('only', 'A title')])),
    ).toEqual([NOT_APPLICABLE]);
  });
});
