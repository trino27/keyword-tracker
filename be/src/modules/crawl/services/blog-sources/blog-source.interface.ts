import type { IFeedDiscovery } from '../feed-discovery/feed-discovery.service';
import type { RobotsPolicy } from '../robots-policy/robots-policy';
import type { ISiteResponse } from '../site-http-client/site-http-client';
import type { TBlogSelection } from '../sitemap-scoring/sitemap-scoring';

/** An HTML answer, as a source reads it. */
export type TFetchedHtml = Pick<ISiteResponse, 'status' | 'text' | 'finalUrl'>;

/**
 * Everything the walk already learned about the site, which every source reads and none
 * repeats: robots.txt, the sitemaps that were fetched and scored, and the feed.
 *
 * `fetchHtml` is here rather than a client of its own because a source must not reach
 * the network on its own terms — the discovery service counts every answer towards the
 * run's verdict (unreachable, blocked, redirected elsewhere), and a request it does not
 * see would be a request missing from that evidence.
 */
export interface IBlogSourceContext {
  readonly origin: string;
  readonly siteKey: string;
  readonly robots: RobotsPolicy;
  /** How many sitemaps the walk actually read; a reason reads it to say why. */
  readonly sitemapsRead: number;
  readonly selection: TBlogSelection;
  readonly feed: IFeedDiscovery;
  fetchHtml(url: string): Promise<TFetchedHtml | null>;
}

/** Where a source says the posts are. */
export interface IBlogSourceFound {
  /** What was read to find them: sitemap URLs, a feed URL, an index page URL. */
  sources: string[];
  /** The post candidates, in source order; the caller filters them to the site. */
  candidates: string[];
  /** For the run log: how this source was chosen, in a sentence. */
  reason: string;
  /**
   * The source is not known to list posts only, so the crawl counts a page as a post
   * only when the page says it is an article.
   */
  articlesOnly: boolean;
}

/**
 * One way of finding a site's blog. `null` means "not this one" — never an error: a
 * site with no feed is ordinary, and the next source gets its turn.
 */
export interface IBlogSource {
  /** Appears in the run's log line, so a run says which source answered. */
  readonly name: string;
  find(context: IBlogSourceContext): Promise<IBlogSourceFound | null>;
}

/**
 * Overrides the order the discovery service tries sources in. Optional: unprovided, the
 * service uses `BLOG_SOURCES`. It exists so a different order — or a source that only an
 * experiment has — is a provider in a module, not an edit to the service.
 */
export const BLOG_SOURCE_ORDER = Symbol('BLOG_SOURCE_ORDER');
