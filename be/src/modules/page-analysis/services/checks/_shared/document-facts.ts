import type { IDocumentPage } from '../../../interfaces/outbound-facts.interface';
import type { ICheckInput } from '../check.interface';
import { declaredCanonicals } from './declared-canonicals';
import { robotsDirectivesForGoogle } from './robots-directives';

/** The two rules that drop a page from the index, as NOINDEX reads them. */
const DROPS_FROM_INDEX = new Set(['noindex', 'none']);

/**
 * What a page declares about itself that another page's check needs: noindex for
 * Google, its canonical, its hreflang set. The crawl builds it for its own pages and for
 * the documents it reads alike, so a canonical target and a post are judged by one
 * function, and by the same readers NOINDEX and CANONICAL_MISMATCH use.
 */
export function documentFactsOf(
  page: Pick<ICheckInput, 'parsed' | 'headers' | 'finalUrl'>,
): IDocumentPage {
  return {
    noindex: robotsDirectivesForGoogle(page).some(({ rules }) =>
      rules.some((rule) => DROPS_FROM_INDEX.has(rule)),
    ),
    canonical: declaredCanonicals(page)[0]?.url ?? null,
    alternates: page.parsed.alternates,
  };
}
