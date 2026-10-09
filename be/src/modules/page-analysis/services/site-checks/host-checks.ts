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
 * Host hops from which a chain counts as one: the common http → https → canonical host
 * takes two, and did on 29 of the 46 sites probed in 2026-10, blog.google and
 * vercel.com among them — one request more for the reader who types the old address,
 * a step Google follows without loss. Three is a chain somebody built by accident.
 */
const CHAIN_MIN_HOPS = 3;

const originOf = (url: string | null) => {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
};

/**
 * The hops that move between hosts and schemes: those up to the first one landing on
 * the address the site serves. What the home page does after that — stripe.com's 307
 * to /en-bg, habr.com's 302 to /ru/feed/ — is the home page's own redirect, the same
 * for every visitor however they arrived, and no part of the variant's chain.
 */
function hostHops(
  answer: IProbeAnswer,
  servedOrigin: string,
): { hops: IProbeAnswer['redirects']; reached: boolean } {
  const { redirects } = answer;
  for (let at = 0; at < redirects.length; at += 1) {
    const next = redirects[at + 1]?.url ?? answer.finalUrl;
    if (originOf(next) === servedOrigin)
      return { hops: redirects.slice(0, at + 1), reached: true };
  }
  return { hops: redirects, reached: false };
}

/**
 * Variants that do redirect, but not straight to the address the site serves: through
 * three host hops or more, by a temporary status, or to somewhere else.
 */
export const hostRedirectChain: TSiteCheck = (input) => {
  const redirected = (input.hostVariants ?? []).filter(
    ({ redirects }) => redirects.length > 0,
  );
  if (redirected.length === 0 || !input.servedOrigin)
    return SITE_NOT_APPLICABLE;
  const served = input.servedOrigin;
  const flawed = redirected.flatMap((answer) => {
    const { hops, reached } = hostHops(answer, served);
    const why: string[] = [];
    if (hops.length >= CHAIN_MIN_HOPS) why.push(`${hops.length} hops`);
    const temporary = hops.filter(({ status }) => TEMPORARY.has(status));
    if (temporary.length > 0)
      why.push(`temporary ${temporary.map(({ status }) => status).join(', ')}`);
    if (!reached)
      why.push(
        `ends at ${originOf(answer.finalUrl) ?? 'no answer'}, not ${served}`,
      );
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
