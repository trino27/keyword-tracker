import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Share of the headline's words the title or the h1 must hold for the two to agree. */
const MIN_SHARED = 0.5;

const SEGMENTER = new Intl.Segmenter(undefined, { granularity: 'word' });

/** The words of a text, lower-cased; split as ICU splits them, so Chinese has words too. */
function wordsOf(text: string): Set<string> {
  const words = new Set<string>();
  for (const segment of SEGMENTER.segment(text.toLowerCase()))
    if (segment.isWordLike) words.add(segment.segment);
  return words;
}

/**
 * The article markup's headline, against what a reader sees as the post's title: the
 * page's <title> and its <h1>s. Half its words found in either is agreement — a
 * shortened or reworded headline keeps most of them — so what fails is a headline about
 * something else, which on a live site is a template printing the same value everywhere.
 */
export const ARTICLE_HEADLINE_MISMATCH_CHECK = defineCheck(
  'ARTICLE_HEADLINE_MISMATCH',
  ({ parsed }) => {
    const headline = parsed.articleMarkup?.headline;
    const visible = [parsed.title, ...parsed.h1s].filter(
      (text): text is string => !!text,
    );
    if (!headline || visible.length === 0) return NOT_APPLICABLE;
    const words = wordsOf(headline);
    if (words.size === 0) return NOT_APPLICABLE;
    const shared = (text: string) => {
      const other = wordsOf(text);
      return [...words].filter((word) => other.has(word)).length / words.size;
    };
    const best = Math.max(...visible.map(shared));
    return best >= MIN_SHARED
      ? PASS
      : fails({
          headline,
          shared: Math.round(best * 100) / 100,
          evidence: evidence([
            `headline: "${headline}"`,
            ...(parsed.title ? [`<title>: "${parsed.title}"`] : []),
            ...parsed.h1s.slice(0, 1).map((h1) => `<h1>: "${h1}"`),
          ]),
        });
  },
);
