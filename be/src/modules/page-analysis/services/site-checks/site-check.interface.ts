import type { TCrawlItemStatus, TSiteCheckCode } from '@app/contracts';
import type { IIconLink } from '../../interfaces/parsed-page.interface';

/**
 * What the home page of the served host says about the site as a whole: its icons and
 * its names. Read from that host because Google reads both per hostname — a blog on a
 * subdomain has a favicon and a site name of its own.
 */
export interface IHomePage {
  /** The address that answered, after redirects. */
  url: string;
  icons: readonly IIconLink[];
  websiteNames: readonly { name: string; alternateNames: string[] }[];
  ogSiteName: string | null;
}

/** The favicon the home page declares, as the crawl fetched it. */
export interface IFaviconAnswer {
  url: string;
  /** Null when no HTTP answer came back at all. */
  status: number | null;
  /** The first bytes of the body, enough to read the file's format and size. */
  head: Uint8Array;
  /** The robots.txt rule keeping Googlebot-Image from the file, quoted; null when none. */
  blockedBy: string | null;
}

/** One answer to a request the crawl made of the site, redirects followed. */
export interface IProbeAnswer {
  url: string;
  /** Null when no HTTP answer came back at all. */
  status: number | null;
  redirects: readonly { url: string; status: number }[];
  finalUrl: string | null;
}

/** A sitemap entry the crawl fetched, and what came of it. */
export interface IFetchedEntry {
  url: string;
  status: TCrawlItemStatus;
  httpStatus: number | null;
  reason: string | null;
  /** The crawled page's findings, by code, when the entry became a page. */
  page: {
    finalUrl: string;
    dateModified: string | null;
    issues: readonly { code: string; details: Record<string, unknown> }[];
  } | null;
}

/**
 * Everything a site check may look at: what discovery read, what selection fetched, and
 * the few extra requests the crawl made for the site checks alone. Gathered before the
 * run's transaction; the checks themselves are pure.
 */
export interface ISiteCheckInput {
  /** Scheme and host the site's pages are served from, e.g. `https://www.a.example`. */
  servedOrigin: string | null;
  /** When the crawl ran: "now" for every date the checks compare against. */
  crawledAt: Date;
  robotsTxt: { status: number | null; truncated: boolean; lines: string[] };
  /** The sitemap's candidate URLs, in order. */
  sitemapUrls: readonly string[];
  /** `<lastmod>` by candidate URL, where the sitemap gave one. */
  lastmods: Readonly<Record<string, string>>;
  fetched: readonly IFetchedEntry[];
  /** The home page at the site's other scheme and host variants; null when not asked. */
  hostVariants: readonly IProbeAnswer[] | null;
  /** A URL that cannot exist on the site; null when it could not be asked. */
  missingPage: IProbeAnswer | null;
  /** The served host's home page; null when it could not be read. */
  home: IHomePage | null;
  /** The icon the home page declares; null when none was fetched. */
  favicon: IFaviconAnswer | null;
}

export type TSiteVerdict =
  | { outcome: 'pass' }
  | { outcome: 'notApplicable' }
  | {
      outcome: 'fails';
      details: Record<string, unknown> & { evidence: string[] };
    };

export const SITE_PASS = { outcome: 'pass' } as const;
export const SITE_NOT_APPLICABLE = { outcome: 'notApplicable' } as const;

export type TSiteCheck = (input: ISiteCheckInput) => TSiteVerdict;

/** One check per site code; a code without a check does not compile. */
export type TSiteCheckRegistry = { [K in TSiteCheckCode]: TSiteCheck };
