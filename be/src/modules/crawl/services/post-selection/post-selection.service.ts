import { Injectable } from '@nestjs/common';
import {
  CRAWL_CANDIDATE_LIMIT,
  CRAWL_POST_LIMIT,
  isSameSite,
} from '@app/contracts';
import {
  RemoteApiError,
  RemoteApiForbiddenAddressError,
  RemoteApiTimeoutError,
  RemoteApiTooLargeError,
  RemoteApiTooManyRedirectsError,
} from '@infrastructure/remote-api/remote-api.errors';
import type { IParsedPage } from '@modules/page-analysis/interfaces/parsed-page.interface';
import { extractPage } from '@modules/page-analysis/services/html-extraction/extract-page';
import {
  ARTICLE_SCHEMA_TYPES,
  BOT_CHALLENGE_REASON,
  CRAWL_FETCH_CONCURRENCY,
  REDIRECTED_OFF_SITE_REASON,
  HTML_CONTENT_TYPES,
  LISTING_SCHEMA_TYPES,
  MAX_PAGE_URL_LENGTH,
  MIN_POST_WORD_COUNT,
  NON_HTML_EXTENSIONS,
} from '../../constants/post-selection.constant';
import type {
  IPostSelection,
  ISelectedItem,
} from '../../interfaces/crawled-page.interface';
import type { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';

export interface IPostSelectionInput {
  /** The selected sitemap group's URLs, in order. */
  urls: string[];
  siteKey: string;
  robots: RobotsPolicy;
  signal: AbortSignal;
  /** Called after each window with the number of posts crawled so far. */
  onProgress?: (crawled: number) => Promise<void>;
  /** The candidates may not all be posts: keep only pages that declare an article. */
  articlesOnly?: boolean;
}

/** What a page says about itself: Open Graph type, or a JSON-LD article type. */
export function isArticle(parsed: IParsedPage): boolean {
  return (
    parsed.openGraph['og:type']?.toLowerCase() === 'article' ||
    parsed.jsonLd.types.some((type) => ARTICLE_SCHEMA_TYPES.has(type))
  );
}

type TItemWithoutPosition = Omit<ISelectedItem, 'sitemapPosition' | 'url'>;

const skip = (
  status: ISelectedItem['status'],
  reason: string,
  httpStatus: number | null = null,
): TItemWithoutPosition => ({ status, reason, httpStatus, page: null });

/**
 * "The first 15 posts in sitemap order" (§10.2): entries are considered position by
 * position, every one is logged with what happened to it, and an entry that is not a
 * post is skipped with a reason rather than silently dropped.
 */
@Injectable()
export class PostSelectionService {
  constructor(private readonly http: SiteHttpClient) {}

  async select(input: IPostSelectionInput): Promise<IPostSelection> {
    const considered = input.urls.slice(0, CRAWL_CANDIDATE_LIMIT);
    const items: ISelectedItem[] = [];
    let crawled = 0;

    for (
      let start = 0;
      start < considered.length && crawled < CRAWL_POST_LIMIT;
      start += CRAWL_FETCH_CONCURRENCY
    ) {
      const window = considered.slice(start, start + CRAWL_FETCH_CONCURRENCY);
      const results = await Promise.all(
        window.map((url, offset) => this.examine(url, start + offset, input)),
      );
      input.signal.throwIfAborted();
      for (const [offset, result] of results.entries()) {
        items.push({
          sitemapPosition: start + offset,
          url: window[offset],
          ...result,
        });
        if (result.status === 'crawled') crawled += 1;
        // The log ends at the 15th post; the rest of the window is not recorded.
        if (crawled === CRAWL_POST_LIMIT) break;
      }
      await input.onProgress?.(crawled);
    }

    const pages = items.flatMap((item) => (item.page ? [item.page] : []));
    return { items, pages };
  }

  private async examine(
    url: string,
    sitemapPosition: number,
    input: IPostSelectionInput,
  ): Promise<TItemWithoutPosition> {
    const before = this.checkBeforeFetch(url, input);
    if (before) return before;

    let response;
    try {
      response = await this.http.getHtml(url, input.signal);
    } catch (error) {
      if (error instanceof RemoteApiError)
        return skip('failed', failureReason(error));
      throw error;
    }

    // Leaving the site is the fact worth logging, whatever the other site answered.
    if (!isSameSite(response.finalUrl, input.siteKey))
      return skip(
        'skipped_other_site',
        REDIRECTED_OFF_SITE_REASON,
        response.status,
      );
    if (response.headers['cf-mitigated']?.toLowerCase() === 'challenge')
      return skip('failed', BOT_CHALLENGE_REASON, response.status);
    if (response.status >= 300)
      return skip('failed', `HTTP ${response.status}`, response.status);

    const contentType = (response.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (contentType && !HTML_CONTENT_TYPES.has(contentType))
      return skip(
        'skipped_not_html',
        `Not HTML (${contentType})`,
        response.status,
      );

    const parsed = extractPage(response.text, response.finalUrl);
    const listing = parsed.jsonLd.types.find((type) =>
      LISTING_SCHEMA_TYPES.has(type),
    );
    if (listing)
      return skip(
        'skipped_listing',
        `Declares itself a listing (JSON-LD ${listing})`,
        response.status,
      );
    if (input.articlesOnly && !isArticle(parsed))
      return skip(
        'skipped_listing',
        'Not marked as an article (no og:type=article, no JSON-LD Article)',
        response.status,
      );
    // Last, because it needs the parse: a page with nothing to read is not a post,
    // whatever its markup claims about itself.
    if (parsed.wordCount < MIN_POST_WORD_COUNT)
      return skip(
        'skipped_listing',
        parsed.clientRendered
          ? `Rendered by JavaScript: the HTML itself holds ${parsed.wordCount} words, ` +
              'which is all a crawler that runs no scripts will ever read'
          : `Too little content to analyse (${parsed.wordCount} words)`,
        response.status,
      );

    return {
      status: 'crawled',
      reason: null,
      httpStatus: response.status,
      page: {
        sitemapPosition,
        url,
        finalUrl: response.finalUrl,
        redirected: response.redirected,
        redirects: response.redirects,
        robots: input.robots,
        httpStatus: response.status,
        headers: response.headers,
        fetchedAt: new Date(),
        responseMs: response.ttfbMs,
        htmlBytes: response.bytes,
        parsed,
      },
    };
  }

  private checkBeforeFetch(
    url: string,
    input: IPostSelectionInput,
  ): TItemWithoutPosition | null {
    if (url.length > MAX_PAGE_URL_LENGTH)
      return skip(
        'failed',
        `URL longer than ${MAX_PAGE_URL_LENGTH} characters`,
      );
    if (!isSameSite(url, input.siteKey))
      return skip('skipped_other_site', 'Belongs to another site');
    const path = new URL(url).pathname;
    if (path === '/' || path === '')
      return skip('skipped_listing', "The site's home page");
    const extension = /\.([a-z0-9]+)$/i.exec(path)?.[1]?.toLowerCase();
    if (extension && NON_HTML_EXTENSIONS.has(extension))
      return skip('skipped_not_html', `Not an HTML page (.${extension})`);
    if (!input.robots.isAllowed(url))
      return skip('skipped_robots', 'Disallowed by robots.txt');
    return null;
  }
}

function failureReason(error: RemoteApiError): string {
  if (error instanceof RemoteApiTimeoutError) return 'Timed out';
  if (error instanceof RemoteApiTooLargeError)
    return 'Larger than the 5 MB page limit';
  if (error instanceof RemoteApiTooManyRedirectsError)
    return 'Too many redirects';
  if (error instanceof RemoteApiForbiddenAddressError)
    return 'Refused: resolves to a non-public address';
  return 'Could not connect';
}
