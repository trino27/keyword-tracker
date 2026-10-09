import { evidence } from '../checks/_shared/evidence';
import {
  SITE_NOT_APPLICABLE,
  SITE_PASS,
  type IProbeAnswer,
  type TSiteCheck,
} from './site-check.interface';

/** Temporary redirects: Google keeps showing the URL that redirected. */
const TEMPORARY = new Set([302, 303, 307]);

const chainOf = (answer: IProbeAnswer) =>
  answer.redirects
    .map(
      ({ url, status }, index) =>
        `${status} ${url} → ${answer.redirects[index + 1]?.url ?? answer.finalUrl}`,
    )
    .join(', ');

/** A variant of the site's address that answers with the page itself, not a redirect. */
export const hostVariantServesContent: TSiteCheck = (input) => {
  if (!input.hostVariants || input.hostVariants.length === 0)
    return SITE_NOT_APPLICABLE;
  const serving = input.hostVariants.filter(
    ({ status, redirects }) =>
      status !== null &&
      status >= 200 &&
      status < 300 &&
      redirects.length === 0,
  );
  return serving.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: {
          variants: serving.map(({ url }) => url),
          evidence: evidence([
            ...serving.map(
              ({ url, status }) =>
                `${url} answered ${status} itself, without redirecting`,
            ),
            `The site serves its pages from ${input.servedOrigin ?? 'another address'}`,
          ]),
        },
      };
};

/**
 * Variants that do redirect, but not in one permanent hop to the address the site
 * serves: two hops or more, a temporary status, or an end somewhere else.
 */
export const hostRedirectChain: TSiteCheck = (input) => {
  const redirected = (input.hostVariants ?? []).filter(
    ({ redirects }) => redirects.length > 0,
  );
  if (redirected.length === 0) return SITE_NOT_APPLICABLE;
  const flawed = redirected.flatMap((answer) => {
    const why: string[] = [];
    if (answer.redirects.length > 1)
      why.push(`${answer.redirects.length} hops`);
    const temporary = answer.redirects.filter(({ status }) =>
      TEMPORARY.has(status),
    );
    if (temporary.length > 0)
      why.push(`temporary ${temporary.map(({ status }) => status).join(', ')}`);
    const end = answer.finalUrl ? new URL(answer.finalUrl).origin : null;
    if (input.servedOrigin && end !== input.servedOrigin)
      why.push(`ends at ${end ?? 'no answer'}, not ${input.servedOrigin}`);
    return why.length === 0 ? [] : [`${chainOf(answer)} — ${why.join('; ')}`];
  });
  return flawed.length === 0
    ? SITE_PASS
    : {
        outcome: 'fails',
        details: { count: flawed.length, evidence: evidence(flawed) },
      };
};

/** A URL that cannot exist, answered with 200 — directly or after a redirect. */
export const soft404: TSiteCheck = (input) => {
  const probe = input.missingPage;
  if (!probe || probe.status === null) return SITE_NOT_APPLICABLE;
  if (probe.status < 200 || probe.status >= 300) return SITE_PASS;
  return {
    outcome: 'fails',
    details: {
      url: probe.url,
      status: probe.status,
      evidence: evidence([
        probe.redirects.length > 0
          ? `GET ${probe.url} redirected (${chainOf(probe)}) and answered ${probe.status}`
          : `GET ${probe.url} answered ${probe.status}`,
        'The address was made up for this check; no page can live there',
      ]),
    },
  };
};
