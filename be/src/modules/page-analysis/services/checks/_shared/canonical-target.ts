import type { IDocumentFacts } from '../../../interfaces/outbound-facts.interface';
import type { ICheckInput } from '../check.interface';
import {
  declaredCanonicals,
  type IDeclaredCanonical,
} from './declared-canonicals';
import { isDevelopmentHost } from './development-host';
import { isHttpTwin } from './http-twin';
import { sameDocument } from './same-document';

/** What is wrong with the page a canonical names, as the crawl found it. */
export type TCanonicalTargetProblem =
  | {
      kind: 'redirects';
      hops: readonly { url: string; status: number }[];
      finalUrl: string;
    }
  | { kind: 'status'; status: number }
  | { kind: 'unreachable'; reason: 'no such domain' | 'a redirect loop' }
  | { kind: 'noindex' }
  | { kind: 'chain'; next: string };

export type TCanonicalTargetVerdict =
  | { verdict: 'notApplicable' }
  | { verdict: 'pass'; canonical: IDeclaredCanonical }
  | {
      verdict: 'problem';
      canonical: IDeclaredCanonical;
      problem: TCanonicalTargetProblem;
    };

const withoutFragment = (url: string) => {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.href;
};

function problemOf(
  document: IDocumentFacts,
): TCanonicalTargetProblem | 'unknown' | null {
  const { outcome } = document;
  if (outcome.kind === 'unchecked') return 'unknown';
  if (outcome.kind === 'failed') {
    if (outcome.failure === 'nxdomain')
      return { kind: 'unreachable', reason: 'no such domain' };
    if (outcome.failure === 'tooManyRedirects')
      return { kind: 'unreachable', reason: 'a redirect loop' };
    return 'unknown';
  }
  if (outcome.redirects.length > 0)
    return {
      kind: 'redirects',
      hops: outcome.redirects,
      finalUrl: outcome.finalUrl,
    };
  if (outcome.status >= 400) return { kind: 'status', status: outcome.status };
  if (!document.page) return null;
  if (document.page.noindex) return { kind: 'noindex' };
  const next = document.page.canonical;
  if (next && !sameDocument(next, outcome.finalUrl))
    return { kind: 'chain', next };
  return null;
}

/**
 * The page a canonical names, judged (plan §10.5): one rule read by CANONICAL_TARGET_BROKEN
 * and by CANONICAL_MISMATCH, which steps aside when it finds a problem (plan D34).
 *
 * A canonical naming the page itself passes. Not applicable without a canonical, or when
 * it is the page's own http:// twin
 * (CANONICAL_TO_HTTP's), a development host (DEVELOPMENT_HOST_REFERENCES'), or a target
 * the crawl could not read — so a target missed by the budget never hides the mismatch.
 */
export function canonicalTargetOf(page: ICheckInput): TCanonicalTargetVerdict {
  const [canonical] = declaredCanonicals(page);
  if (!canonical) return { verdict: 'notApplicable' };
  // The page names itself: the target is the page the crawl just read, and it answered.
  if (sameDocument(canonical.url, page.finalUrl))
    return { verdict: 'pass', canonical };
  if (isHttpTwin(canonical.url, page.finalUrl))
    return { verdict: 'notApplicable' };
  let key: string;
  try {
    key = withoutFragment(canonical.url);
    if (
      isDevelopmentHost(new URL(key).hostname, new URL(page.finalUrl).hostname)
    )
      return { verdict: 'notApplicable' };
  } catch {
    return { verdict: 'notApplicable' };
  }
  const document = page.linkStatuses.documents.get(key);
  if (!document) return { verdict: 'notApplicable' };
  const problem = problemOf(document);
  if (problem === 'unknown') return { verdict: 'notApplicable' };
  return problem
    ? { verdict: 'problem', canonical, problem }
    : { verdict: 'pass', canonical };
}
