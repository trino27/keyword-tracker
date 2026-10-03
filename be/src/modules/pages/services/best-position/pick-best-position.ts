import type { IBestPosition, IKeywordPosition } from '@app/contracts';

/**
 * A page's best position across its keywords (D6): the lowest number wins; a tie goes
 * to the more relevant keyword, then alphabetically, so the answer is stable. null
 * when no keyword has a position yet.
 */
export function pickBestPosition(
  keywords: IKeywordPosition[],
): IBestPosition | null {
  let best: IKeywordPosition | null = null;
  for (const keyword of keywords) {
    if (keyword.latestPosition === null || keyword.latestCapturedAt === null)
      continue;
    if (
      best === null ||
      keyword.latestPosition < best.latestPosition! ||
      (keyword.latestPosition === best.latestPosition &&
        (keyword.relevance > best.relevance ||
          (keyword.relevance === best.relevance && keyword.term < best.term)))
    ) {
      best = keyword;
    }
  }
  return best
    ? {
        position: best.latestPosition!,
        keywordId: best.keywordId,
        term: best.term,
        capturedAt: best.latestCapturedAt!,
      }
    : null;
}
