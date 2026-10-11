import {
  canonicalTargetOf,
  type TCanonicalTargetProblem,
} from '../_shared/canonical-target';
import { quoteCanonical } from '../_shared/declared-canonicals';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** What the target answered, in the words the finding quotes. */
function describe(url: string, problem: TCanonicalTargetProblem): string {
  switch (problem.kind) {
    case 'redirects':
      return `${url} redirects (${problem.hops.map(({ status }) => status).join(' → ')}) to ${problem.finalUrl}`;
    case 'status':
      return `${url} answers HTTP ${problem.status}`;
    case 'unreachable':
      return `${url} cannot be reached: ${problem.reason}`;
    case 'noindex':
      return `${url} is set to noindex`;
    case 'chain':
      return `${url} names ${problem.next} as its own canonical`;
  }
}

/**
 * The page this one names as canonical, as the crawl found it (plan §10.5): one that
 * redirects, answers an error, is set to noindex or names a canonical of its own is no
 * page Google can settle on, so it may pick either or neither. Judged only when the
 * target was read; one that could not be is CANONICAL_MISMATCH's, as before.
 */
export const CANONICAL_TARGET_BROKEN_CHECK = defineCheck(
  'CANONICAL_TARGET_BROKEN',
  (page) => {
    const target = canonicalTargetOf(page);
    if (target.verdict === 'notApplicable') return NOT_APPLICABLE;
    if (target.verdict === 'pass') return PASS;
    const { canonical, problem } = target;
    return fails({
      canonical: canonical.url,
      problem: problem.kind,
      ...(problem.kind === 'status' ? { status: problem.status } : {}),
      ...(problem.kind === 'chain' ? { next: problem.next } : {}),
      evidence: evidence([
        quoteCanonical(canonical),
        describe(canonical.url, problem),
      ]),
    });
  },
);
