import type { TOutboundOutcome } from '../../../interfaces/outbound-facts.interface';
import { contentLinksOf, coverageNote } from '../_shared/content-links';
import { evidence } from '../_shared/evidence';
import { linkVerdictOf } from '../_shared/link-verdict';
import { sameSite } from '../_shared/same-site';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Why a broken link is broken, in the words a reader checks it by. */
function whyBroken(outcome: TOutboundOutcome): string {
  if (outcome.kind === 'failed')
    return outcome.failure === 'nxdomain'
      ? 'the domain does not exist'
      : 'redirects in a loop';
  if (outcome.kind === 'answered' && outcome.redirects.length > 0)
    return `redirects to ${outcome.finalUrl}, which answers HTTP ${outcome.status}`;
  return outcome.kind === 'answered'
    ? `answers HTTP ${outcome.status}`
    : 'could not be checked';
}

/**
 * Content links that lead nowhere (plan D3): a link to this site answering 4xx or 5xx or
 * looping, and a link elsewhere answering 404 or 410 or naming a domain that does not
 * exist. Every other refusal from another site reads as "could not check", because an
 * anti-bot wall answers a crawler what it never answers a reader.
 *
 * Judged only on the links the outbound stage could ask; how many that was is said
 * whenever it is not all of them, so the rest are never implied to be fine.
 */
export const BROKEN_LINKS_CHECK = defineCheck('BROKEN_LINKS', (page) => {
  const links = contentLinksOf(page);
  const judged = links.flatMap((url) => {
    const outcome = page.linkStatuses.links.get(url);
    if (!outcome || outcome.kind === 'unchecked') return [];
    return [
      {
        url,
        outcome,
        verdict: linkVerdictOf(outcome, sameSite(url, page.finalUrl)),
      },
    ];
  });
  if (judged.length === 0) return NOT_APPLICABLE;
  const broken = judged.filter(({ verdict }) => verdict === 'broken');
  if (broken.length === 0) return PASS;
  return fails({
    count: broken.length,
    checked: judged.length,
    total: links.length,
    links: broken.map(({ url }) => url),
    evidence: [
      ...evidence(
        broken.map(({ url, outcome }) => `${url} — ${whyBroken(outcome)}`),
      ),
      ...coverageNote(judged.length, links.length),
    ],
  });
});
