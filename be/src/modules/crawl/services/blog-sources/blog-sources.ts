import { isSameSite } from '@app/contracts';
import {
  MIN_LISTING_LINKS,
  WELL_KNOWN_LISTING_PATHS,
} from '../../constants/sitemap-scoring.constant';
import type { IFeedDiscovery } from '../feed-discovery/feed-discovery.service';
import { extractListingLinks } from '../listing-links/listing-links';
import type {
  IBlogSource,
  IBlogSourceContext,
  IBlogSourceFound,
} from './blog-source.interface';

/** A sitemap group as a found source; `articlesOnly` says whether it was confirmed. */
function fromSelection(
  context: IBlogSourceContext,
  articlesOnly: boolean,
): IBlogSourceFound | null {
  if (!context.selection.ok) return null;
  const { group } = context.selection.winner;
  return {
    sources: group.sitemapUrls,
    candidates: group.urls,
    reason: context.selection.reason,
    articlesOnly,
  };
}

function feedReason(feed: IFeedDiscovery, sitemapsRead: number): string {
  const why =
    sitemapsRead === 0 ? 'No sitemap found' : 'No sitemap looks like a blog';
  return `${why}; read the feed ${feed.feedUrl} (${feed.links.length} posts, newest first).`;
}

/** A sitemap that scored as a blog: the only source that names posts and is sure of it. */
export const CONFIRMED_SITEMAP_SOURCE: IBlogSource = {
  name: 'sitemap',
  find(context) {
    const confirmed = context.selection.ok && context.selection.confirmed;
    return Promise.resolve(confirmed ? fromSelection(context, false) : null);
  },
};

/** The site's own feed: its items are posts by definition, newest first. */
export const FEED_SOURCE: IBlogSource = {
  name: 'feed',
  find({ feed, sitemapsRead }) {
    if (!feed.feedUrl || feed.links.length === 0) return Promise.resolve(null);
    return Promise.resolve({
      sources: [feed.feedUrl],
      candidates: feed.links,
      reason: feedReason(feed, sitemapsRead),
      articlesOnly: false,
    });
  },
};

/**
 * The first well-known blog index (`/blog/`, `/news/`, …) that links to enough posts
 * below itself. It does not know which of those links are posts, hence `articlesOnly`.
 */
export const LISTING_SOURCE: IBlogSource = {
  name: 'listing',
  async find(context) {
    for (const path of WELL_KNOWN_LISTING_PATHS) {
      const url = `${context.origin}${path}`;
      if (!context.robots.isAllowed(url)) continue;
      const response = await context.fetchHtml(url);
      if (
        response?.status !== 200 ||
        !isSameSite(response.finalUrl, context.siteKey)
      )
        continue;
      const links = extractListingLinks(
        response.text,
        response.finalUrl,
        context.siteKey,
      );
      if (links.length < MIN_LISTING_LINKS) continue;
      return {
        sources: [response.finalUrl],
        candidates: links,
        reason: `No sitemap looks like a blog; read the index page ${response.finalUrl} (${links.length} links below it). Only pages marked as articles count as posts.`,
        articlesOnly: true,
      };
    }
    return null;
  },
};

/** The least unlikely sitemap, when nothing confirmed the blog. */
export const UNCONFIRMED_SITEMAP_SOURCE: IBlogSource = {
  name: 'unconfirmed-sitemap',
  find(context) {
    return Promise.resolve(fromSelection(context, true));
  },
};

/**
 * Where a blog is looked for, in order of confidence (§10.1). The first source that
 * answers wins, and a source that costs a request is only asked once the free ones have
 * declined — the listing is fetched after the sitemaps and the feed have failed, never
 * before.
 *
 * The order is data on purpose. Adding a way to find a blog (the HTML-only fallback
 * this needs next) is a class and an entry here, not a branch cut into the middle of
 * the discovery service; and an experiment that reorders them is a reordered array.
 */
export const BLOG_SOURCES: readonly IBlogSource[] = [
  CONFIRMED_SITEMAP_SOURCE,
  FEED_SOURCE,
  LISTING_SOURCE,
  UNCONFIRMED_SITEMAP_SOURCE,
];
