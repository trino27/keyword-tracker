import { Injectable } from '@nestjs/common';
import { RemoteApiError } from '@infrastructure/remote-api/remote-api.errors';
import type { IProbeAnswer } from '@modules/page-analysis/services/site-checks/site-check.interface';
import type { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';

export interface ISiteProbes {
  /** The scheme and host the crawled pages were served from. */
  servedOrigin: string;
  hostVariants: IProbeAnswer[];
  missingPage: IProbeAnswer | null;
}

/** The www-variant of a host: added when absent, removed when present. */
const otherWwwVariant = (host: string) =>
  host.startsWith('www.') ? host.slice(4) : `www.${host}`;

/**
 * Second-level labels under which a country code registers names — `bbc.co.uk` is a
 * site's own name, `blog.example.com` is not. No public-suffix list is shipped; these
 * cover the registries a client's site is likely to sit under.
 */
const SECOND_LEVEL_LABELS = new Set([
  'co',
  'com',
  'net',
  'org',
  'gov',
  'edu',
  'ac',
  'or',
  'ne',
  'go',
  'gob',
]);

/**
 * Whether the host is a site's own name, which has a www-variant, rather than a
 * subdomain of one, which has none: nobody types `www.blog.cloudflare.com`, and
 * blog.duolingo.com was reported for where that address went (2026-10).
 */
export function hasWwwVariant(host: string): boolean {
  const labels = host.replace(/^www\./, '').split('.');
  if (labels.length <= 2) return true;
  return labels.length === 3 && SECOND_LEVEL_LABELS.has(labels[1]);
}

/**
 * The few requests the site checks need beyond what the crawl already fetched: the home
 * page at the site's other scheme and host variants, and an address that cannot exist.
 * Four requests a crawl, made after the posts and before the transaction.
 *
 * Every answer is kept as it came — a variant that does not resolve is an answer of no
 * status, which the checks read as "nothing served there", not as a failure of the run.
 */
@Injectable()
export class SiteProbeService {
  constructor(private readonly http: SiteHttpClient) {}

  async probe(
    servedOrigin: string,
    robots: RobotsPolicy,
    runId: number,
    signal: AbortSignal,
  ): Promise<ISiteProbes> {
    const served = new URL(servedOrigin);
    const hosts = hasWwwVariant(served.hostname)
      ? [served.hostname, otherWwwVariant(served.hostname)]
      : [served.hostname];
    const variants = hosts
      .flatMap((host) =>
        ['https:', 'http:'].map((scheme) => `${scheme}//${host}`),
      )
      .filter((origin) => origin !== servedOrigin)
      .map((origin) => `${origin}/`);
    const hostVariants: IProbeAnswer[] = [];
    for (const url of variants) hostVariants.push(await this.ask(url, signal));
    // Named so that no site could have a page there, and so that a reader of the
    // site's logs can tell what asked.
    const missing = `${servedOrigin}/seo-keyword-tracker-missing-page-${runId}/`;
    return {
      servedOrigin,
      hostVariants,
      missingPage: robots.isAllowed(missing)
        ? await this.ask(missing, signal)
        : null,
    };
  }

  private async ask(url: string, signal: AbortSignal): Promise<IProbeAnswer> {
    try {
      const response = await this.http.probe(url, signal);
      return {
        url,
        status: response.status,
        redirects: response.redirects,
        finalUrl: response.finalUrl,
      };
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      return { url, status: null, redirects: [], finalUrl: null };
    }
  }
}
