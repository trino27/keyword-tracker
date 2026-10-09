import { normalizeText } from '../../text/normalize-text/normalize-text';
import { evidence } from '../_shared/evidence';
import {
  defineRunCheck,
  fails,
  NOT_APPLICABLE,
  PASS,
  type TVerdict,
} from '../check.interface';

/** Words per shingle: long enough that common phrasing does not match by chance. */
const SHINGLE_WORDS = 5;

/** Below this many shingles a page is too short to call a copy of anything. */
const MIN_SHINGLES = 50;

/**
 * Share of the two pages' distinct shingles that both hold (Jaccard). A page whose city
 * name was swapped ten times in 300 words still shares about 0.7; two posts on one topic
 * written separately share almost nothing — on the 43 recorded posts the closest pair
 * shares 0.19 (semrush) and 0.08 (yoast).
 */
const MIN_SIMILARITY = 0.6;

function shinglesOf(text: string): Set<string> {
  const words = text.split(' ').filter(Boolean);
  const shingles = new Set<string>();
  for (let at = 0; at + SHINGLE_WORDS <= words.length; at += 1)
    shingles.add(words.slice(at, at + SHINGLE_WORDS).join(' '));
  return shingles;
}

function similarity(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const shingle of a) if (b.has(shingle)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * Pages of one crawl whose main text is mostly the same five-word sequences. Main text
 * only: the extractor has removed the template, so two posts sharing a sidebar are not
 * duplicates, and two posts sharing their argument are.
 */
export const NEAR_DUPLICATE_CONTENT_CHECK = defineRunCheck(
  'NEAR_DUPLICATE_CONTENT',
  (input) => {
    const texts = input.pages.map((page) =>
      page.parsed.blocks.map(normalizeText),
    );
    const shingles = texts.map((blocks) => shinglesOf(blocks.join(' ')));

    return input.pages.map(
      (page, index): TVerdict<'NEAR_DUPLICATE_CONTENT'> => {
        if (input.pages.length < 2 || shingles[index].size < MIN_SHINGLES)
          return NOT_APPLICABLE;
        const matches = input.pages
          .map((other, at) => ({
            url: other.url,
            at,
            score:
              at === index || shingles[at].size < MIN_SHINGLES
                ? 0
                : similarity(shingles[index], shingles[at]),
          }))
          .filter(({ score }) => score >= MIN_SIMILARITY)
          .sort((a, b) => b.score - a.score);
        if (matches.length === 0) return PASS;
        const [closest] = matches;
        const otherText = ` ${texts[closest.at].join(' ')} `;
        // A passage the reader can find on both pages.
        const shared = page.parsed.blocks.find(
          (block, at) =>
            texts[index][at].split(' ').length >= 8 &&
            otherText.includes(` ${texts[index][at]} `),
        );
        return fails({
          similarity: Number(closest.score.toFixed(2)),
          otherUrls: matches.map(({ url }) => url),
          evidence: evidence([
            ...matches.map(
              ({ url, score }) =>
                `${Math.round(score * 100)}% of the text's five-word sequences also appear on ${url}`,
            ),
            ...(shared ? [`On both pages: "${shared}"`] : []),
          ]),
        });
      },
    );
  },
);
