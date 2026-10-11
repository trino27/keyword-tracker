import { Injectable } from '@nestjs/common';
import { RemoteApiError } from '@infrastructure/remote-api/remote-api.errors';
import { extractPage } from '@modules/page-analysis/services/html-extraction/extract-page';
import { faviconTargetOf } from '@modules/page-analysis/services/site-checks/home-checks';
import type {
  IFaviconAnswer,
  IHomePage,
  IProbeAnswer,
} from '@modules/page-analysis/services/site-checks/site-check.interface';
import type { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';

export interface ISiteProbes {
  /** The scheme and host the crawled pages were served from. */
  servedOrigin: string;
  hostVariants: IProbeAnswer[];
  missingPage: IProbeAnswer | null;
  /** The served host's home page, read for its icons and names; null when unreadable. */
  home: IHomePage | null;
  /** The icon that home page declares, fetched; null when none could be. */
  favicon: IFaviconAnswer | null;
}

/** The crawler Google fetches favicons with, by its robots.txt product token. */
const GOOGLEBOT_IMAGE = 'Googlebot-Image';

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
 * page at the site's other scheme and host variants, an address that cannot exist, and
 * the served home page with the icon it declares. Up to seven requests a crawl, made
 * after the posts and before the transaction.
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
    const missingPage = robots.isAllowed(missing)
      ? await this.ask(missing, signal)
      : null;
    const home = await this.readHome(`${servedOrigin}/`, robots, signal);
    return {
      servedOrigin,
      hostVariants,
      missingPage,
      home,
      favicon: home ? await this.fetchFavicon(home, robots, signal) : null,
    };
  }

  /**
   * The served host's home page, as its icons and names. Read here rather than reused
   * from discovery, which read the CLIENT's address: a blog on a subdomain is another
   * hostname to Google, with a favicon and a site name of its own.
   */
  private async readHome(
    url: string,
    robots: RobotsPolicy,
    signal: AbortSignal,
  ): Promise<IHomePage | null> {
    if (!robots.isAllowed(url)) return null;
    try {
      const response = await this.http.getHtml(url, signal);
      if (response.status !== 200) return null;
      const parsed = extractPage(response.text, response.finalUrl);
      return {
        url: response.finalUrl,
        icons: parsed.icons,
        websiteNames: parsed.websiteNames,
        ogSiteName: parsed.openGraph['og:site_name'] ?? null,
      };
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      return null;
    }
  }

  /**
   * The icon Google would use, asked of robots.txt for Googlebot-Image and fetched — the
   * first bytes only, which carry the format and the size. Not fetched when robots.txt
   * forbids this crawler, or when it already keeps Googlebot-Image out, which is the
   * finding whatever the file holds.
   */
  private async fetchFavicon(
    home: IHomePage,
    robots: RobotsPolicy,
    signal: AbortSignal,
  ): Promise<IFaviconAnswer | null> {
    const target = faviconTargetOf(home);
    if (!target) return null;
    const url = target.href;
    if (robots.allows(url, GOOGLEBOT_IMAGE) === false)
      return {
        url,
        status: null,
        head: new Uint8Array(),
        blockedBy: robots.matchingRule(url, GOOGLEBOT_IMAGE) ?? 'Disallow',
      };
    if (!robots.isAllowed(url)) return null;
    try {
      const response = await this.http.getImageHead(url, signal);
      return {
        url,
        status: response.status,
        head: new Uint8Array(response.body.subarray(0, 4096)),
        blockedBy: null,
      };
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      return { url, status: null, head: new Uint8Array(), blockedBy: null };
    }
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
