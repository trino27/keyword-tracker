import { Injectable } from '@nestjs/common';
import { isSameSite } from '@app/contracts';
import { RemoteApiError } from '@infrastructure/remote-api/remote-api.errors';
import { WELL_KNOWN_FEED_PATHS } from '../../constants/sitemap-scoring.constant';
import { findAlternateFeeds, parseFeedLinks } from '../feed-parser/feed-parser';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import { pageKeyOf } from '../sitemap-scoring/sitemap-scoring';

export interface IFeedDiscovery {
  feedUrl: string | null;
  /** Page keys (`pageKeyOf`) of the feed's same-site items. */
  keys: ReadonlySet<string>;
  /** The same-site item links, in feed order (newest first, as feeds list them). */
  links: string[];
}

const NO_FEED: IFeedDiscovery = { feedUrl: null, keys: new Set(), links: [] };

/**
 * The site's own list of its latest posts: the strongest evidence of which sitemap is
 * the blog. Advertised feeds first, then the usual addresses; the first document that
 * parses as a feed wins. No feed is a normal outcome, not a failure.
 */
@Injectable()
export class FeedDiscoveryService {
  constructor(private readonly http: SiteHttpClient) {}

  async discover(
    origin: string,
    siteKey: string,
    homeHtml: string | null,
    signal: AbortSignal,
  ): Promise<IFeedDiscovery> {
    const advertised = homeHtml
      ? findAlternateFeeds(homeHtml, `${origin}/`).filter((url) =>
          isSameSite(url, siteKey),
        )
      : [];
    const candidates = [
      ...new Set([
        ...advertised,
        ...WELL_KNOWN_FEED_PATHS.map((path) => `${origin}${path}`),
      ]),
    ];

    for (const url of candidates) {
      const links = await this.tryFeed(url, signal);
      if (links === null) continue;
      const ownLinks = links.filter((link) => isSameSite(link, siteKey));
      // A feed of nothing on this site says nothing about it; try the next address.
      if (ownLinks.length === 0) continue;
      const keys = ownLinks
        .map(pageKeyOf)
        .filter((key): key is string => key !== null);
      return {
        feedUrl: url,
        keys: new Set(keys),
        links: [...new Set(ownLinks)],
      };
    }
    return NO_FEED;
  }

  private async tryFeed(
    url: string,
    signal: AbortSignal,
  ): Promise<string[] | null> {
    try {
      const response = await this.http.getFeed(url, signal);
      return response.status === 200 ? parseFeedLinks(response.text) : null;
    } catch (error) {
      if (error instanceof RemoteApiError) return null;
      throw error;
    }
  }
}
