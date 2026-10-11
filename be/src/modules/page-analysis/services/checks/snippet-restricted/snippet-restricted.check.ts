import { evidence } from '../_shared/evidence';
import { robotsDirectivesForGoogle } from '../_shared/robots-directives';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * The rules that leave a result with no text at all. A positive `max-snippet` only
 * shortens it, and `data-nosnippet` on part of the page hides that part: both are
 * ordinary editorial choices, not this finding.
 */
const NO_TEXT = new Set(['nosnippet', 'max-snippet:0']);

/**
 * A page Google may show no text from — and, by the same controls, may not quote in its
 * AI features. Read from the same declarations NOINDEX reads, scoped to Google the same
 * way.
 *
 * Always applicable: a page without the rule has passed, not escaped.
 */
export const SNIPPET_RESTRICTED_CHECK = defineCheck(
  'SNIPPET_RESTRICTED',
  (page) => {
    for (const found of robotsDirectivesForGoogle(page)) {
      const rule = found.rules.find((candidate) => NO_TEXT.has(candidate));
      if (rule)
        return fails({
          source: found.source,
          ...(found.name ? { name: found.name } : {}),
          rule,
          evidence: evidence([found.quote]),
        });
    }
    // The article wrapped in data-nosnippet: no text from inside it reaches the snippet,
    // which leaves the page as quotable as a nosnippet rule would.
    if (page.parsed.contentNosnippet)
      return fails({
        source: 'markup',
        rule: 'data-nosnippet',
        evidence: evidence([
          `${page.parsed.contentNosnippet} — holds most of the article's text`,
        ]),
      });
    return PASS;
  },
);
