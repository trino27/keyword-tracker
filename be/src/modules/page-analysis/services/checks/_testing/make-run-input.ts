import type { ISelectedKeyword } from '../../keyword-extraction/select-keywords/select-keywords';
import type { ICheckInput, IRunInput } from '../check.interface';
import { makeCheckInput } from './make-check-input';

/**
 * One page of a run, named by its path so a duplication finding reads as URLs.
 *
 * Its canonical, its hreflang self-reference and its text follow its URL, because `makeCheckInput`
 * builds a page that passes every check and a fixed URL in either would make every page
 * but one fail — a failure about the fixture, not about the check under test.
 */
export const runPage = (
  path: string,
  overrides: Parameters<typeof makeCheckInput>[0] = {},
): ICheckInput => {
  const url = `https://a.example/${path}/`;
  const { parsed, ...rest } = overrides;
  return makeCheckInput({
    url,
    finalUrl: url,
    // Seen before, unchanged and under the same date — so the comparison applies and
    // passes, as it does for a page nobody touched.
    previous: {
      contentHash: 'a'.repeat(64),
      dateModified: '2026-02-01T09:00:00Z',
      crawledAt: new Date('2026-09-01T00:00:00Z'),
    },
    ...rest,
    parsed: {
      // Text of its own, long enough to be compared and shared with no other page.
      blocks: Array.from({ length: 10 }, (_, n) =>
        Array.from({ length: 12 }, (_, k) => `${path}${n}w${k}`).join(' '),
      ),
      canonicals: [url],
      alternates: [{ lang: 'en', href: url }],
      ...parsed,
    },
  });
};

/** A keyword list for one page; only the leading term decides cannibalisation. */
export const keywordsOf = (...terms: string[]): ISelectedKeyword[] =>
  terms.map((term, index) => ({ term, relevance: 1 - index / 100 }));

export const makeRunInput = (
  pages: ICheckInput[],
  keywords: ISelectedKeyword[][] = pages.map(() => []),
): IRunInput => ({ pages, keywords });
