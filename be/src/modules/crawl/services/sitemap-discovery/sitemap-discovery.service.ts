import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { isSameSite, siteKeyOf, type TCrawlRunErrorCode } from '@app/contracts';
import {
  RemoteApiError,
  RemoteApiTimeoutError,
  RemoteApiUnavailableError,
} from '@infrastructure/remote-api/remote-api.errors';
import type { ISiteResponse } from '../site-http-client/site-http-client';
import {
  SITEMAP_MAX_DEPTH,
  SITEMAP_MAX_FETCHES,
  WELL_KNOWN_SITEMAP_PATHS,
} from '../../constants/sitemap-scoring.constant';
import {
  isBotChallenge,
  REFUSAL_STATUSES,
} from '../../constants/site-fetch.constant';
import {
  BLOG_SOURCE_ORDER,
  type IBlogSource,
  type IBlogSourceContext,
  type IBlogSourceFound,
} from '../blog-sources/blog-source.interface';
import { BLOG_SOURCES } from '../blog-sources/blog-sources';
import { FeedDiscoveryService } from '../feed-discovery/feed-discovery.service';
import { parseFeedLinks } from '../feed-parser/feed-parser';
import { RobotsPolicy } from '../robots-policy/robots-policy';
import { SiteHttpClient } from '../site-http-client/site-http-client';
import {
  parseSitemap,
  type TParsedSitemap,
} from '../sitemap-parser/sitemap-parser';
import {
  groupSitemaps,
  nameScoreOf,
  selectBlogGroup,
  type ISitemapLeaf,
} from '../sitemap-scoring/sitemap-scoring';

export interface IDiscoveryTarget {
  websiteUrl: string;
  siteKey: string;
}

export type TSitemapDiscovery =
  | {
      ok: true;
      robots: RobotsPolicy;
      /** Where the candidates came from: sitemaps, a feed, or a blog index page. */
      sitemapUrls: string[];
      /** Same-site, deduplicated, in source order — the post candidates. */
      urls: string[];
      reason: string;
      /**
       * The source is not known to list posts only: count a page as a post only when it
       * says it is an article.
       */
      articlesOnly: boolean;
      /** What the site checks need from this walk; nothing here steers the crawl. */
      facts: IDiscoveryFacts;
    }
  | {
      ok: false;
      robots: RobotsPolicy;
      errorCode: Extract<
        TCrawlRunErrorCode,
        | 'SITEMAP_NOT_FOUND'
        | 'BLOG_SITEMAP_NOT_FOUND'
        | 'SITE_UNREACHABLE'
        | 'SITE_BLOCKED'
        | 'SITE_REDIRECTS_ELSEWHERE'
        | 'ROBOTS_UNAVAILABLE'
      >;
      detail: string;
    };

/** What discovery saw of the site, kept for the site checks. */
export interface IDiscoveryFacts {
  /** robots.txt as answered: null status when it was never answered. */
  robotsTxt: { status: number | null; truncated: boolean; lines: string[] };
  /** `<lastmod>` of the candidate URLs, by URL, where the sitemap gave one. */
  lastmods: Record<string, string>;
}

interface IPending {
  url: string;
  depth: number;
  seq: number;
  priority: number;
}

interface IWalkState {
  fetches: number;
  /** Requests that got any HTTP answer. */
  answered: number;
  /** Answers that were content (200), not counting robots.txt. */
  usable: number;
  /** 401/403/429 answers and requests that got no answer: signs of a bot wall. */
  refused: number;
  seq: number;
  seen: Set<string>;
  pending: IPending[];
  leaves: ISitemapLeaf[];
  /** Feeds named where a sitemap was expected — the protocol allows it. */
  feeds: string[];
  /** Where the site's pages lead when they redirect off it: the site has moved. */
  redirectedTo: string | null;
  /** `<lastmod>` of every same-site URL any sitemap listed. */
  lastmods: Map<string, string>;
  robotsTxt: IDiscoveryFacts['robotsTxt'];
}

type TDiscoveryFailure = Extract<TSitemapDiscovery, { ok: false }>;

/** Below this, a sitemap on a sibling subdomain waits for the site's own. */
const OTHER_HOST_PRIORITY = -10;

/**
 * Finds the blog without knowing the site (§10.1): reads robots.txt, walks the sitemaps
 * within a fetch budget, reads the home page and the feed — and then asks each of
 * `BLOG_SOURCES` in turn, which is where the order of confidence lives and the only
 * place it is written down. No post page is fetched here.
 *
 * What this service owns is the evidence: every request goes through it, so the counts
 * behind a failed run's verdict (unreachable, blocked, moved elsewhere) stay complete
 * however many sources ask for a page.
 */
@Injectable()
export class SitemapDiscoveryService {
  constructor(
    private readonly http: SiteHttpClient,
    private readonly feeds: FeedDiscoveryService,
    @InjectPinoLogger(SitemapDiscoveryService.name)
    private readonly logger: PinoLogger,
    @Optional()
    @Inject(BLOG_SOURCE_ORDER)
    private readonly sources: readonly IBlogSource[] = BLOG_SOURCES,
  ) {}

  async discover(
    target: IDiscoveryTarget,
    signal: AbortSignal,
  ): Promise<TSitemapDiscovery> {
    const origin = target.websiteUrl.replace(/\/+$/, '');
    const { siteKey } = target;
    const state: IWalkState = {
      fetches: 0,
      answered: 0,
      usable: 0,
      refused: 0,
      seq: 0,
      seen: new Set(),
      pending: [],
      leaves: [],
      feeds: [],
      redirectedTo: null,
      lastmods: new Map(),
      robotsTxt: { status: null, truncated: false, lines: [] },
    };

    const read = await this.readRobots(origin, state, signal);
    if ('errorCode' in read) return read;
    const { robots } = read;
    const declared = robots
      .sitemaps()
      .map((raw) => resolve(raw, `${origin}/robots.txt`))
      .filter((url): url is string => url !== null && isSiteHost(url, siteKey));

    if (declared.length > 0) {
      declared.forEach((url) => this.enqueue(state, url, 0, siteKey));
    } else {
      await this.probeWellKnown(origin, siteKey, state, signal);
    }
    await this.walk(siteKey, state, signal);

    const home = await this.readHome(origin, siteKey, state, signal);
    const feed = await this.feeds.discover(
      origin,
      siteKey,
      home,
      signal,
      state.feeds,
    );
    const context: IBlogSourceContext = {
      origin,
      siteKey,
      robots,
      sitemapsRead: state.leaves.length,
      selection: selectBlogGroup(
        groupSitemaps(state.leaves),
        feed.keys,
        siteKey,
      ),
      feed,
      fetchHtml: (url) => this.fetchHtml(url, state, signal),
    };

    for (const source of this.sources) {
      const found = await source.find(context);
      if (found) return this.found(robots, siteKey, source.name, found, state);
    }
    return this.failure(robots, origin, state);
  }

  private found(
    robots: RobotsPolicy,
    siteKey: string,
    source: string,
    found: IBlogSourceFound,
    state: IWalkState,
  ): TSitemapDiscovery {
    const urls = [
      ...new Set(found.candidates.filter((url) => isSameSite(url, siteKey))),
    ];
    this.logger.info(
      {
        siteKey,
        source,
        sources: found.sources,
        urls: urls.length,
        articlesOnly: found.articlesOnly,
      },
      'blog source selected',
    );
    return {
      ok: true,
      robots,
      sitemapUrls: found.sources,
      urls,
      reason: found.reason,
      articlesOnly: found.articlesOnly,
      facts: {
        robotsTxt: state.robotsTxt,
        lastmods: Object.fromEntries(
          urls.flatMap((url) => {
            const lastmod = state.lastmods.get(url);
            return lastmod ? [[url, lastmod]] : [];
          }),
        ),
      },
    };
  }

  private failure(
    robots: RobotsPolicy,
    origin: string,
    state: IWalkState,
  ): TSitemapDiscovery {
    if (state.answered === 0) {
      return {
        ok: false,
        robots,
        errorCode: 'SITE_UNREACHABLE',
        detail: `No answer from ${origin}.`,
      };
    }
    if (state.redirectedTo) {
      return {
        ok: false,
        robots,
        errorCode: 'SITE_REDIRECTS_ELSEWHERE',
        detail: `${origin} redirects to ${state.redirectedTo}.`,
      };
    }
    if (state.usable === 0 && state.refused > 0) {
      return {
        ok: false,
        robots,
        errorCode: 'SITE_BLOCKED',
        detail: `${state.refused} requests refused or unanswered; nothing readable came back.`,
      };
    }
    if (state.leaves.length === 0) {
      return {
        ok: false,
        robots,
        errorCode: 'SITEMAP_NOT_FOUND',
        detail: `No sitemap found in robots.txt or at ${WELL_KNOWN_SITEMAP_PATHS.join(', ')}, no feed, no blog index page.`,
      };
    }
    return {
      ok: false,
      robots,
      errorCode: 'BLOG_SITEMAP_NOT_FOUND',
      detail: `${state.leaves.length} sitemaps read; all are marked as something other than a blog.`,
    };
  }

  /**
   * RFC 9309 and Google's reading of it: a 4xx robots.txt allows everything — except 429,
   * which like a 5xx forbids everything until it answers — and so does a robots.txt that
   * cannot be fetched at all: a timeout or a refused connection is a server error, not a
   * missing file. Reading those as "no rules" crawled sites Google would have left alone.
   * A bot challenge on robots.txt is a wall in front of the whole site. More than five
   * redirects is Google's 404, and so no rules.
   */
  private async readRobots(
    origin: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<{ robots: RobotsPolicy } | TDiscoveryFailure> {
    try {
      const response = await this.http.getRobots(origin, signal);
      state.answered += 1;
      state.robotsTxt = {
        status: response.status,
        truncated: response.truncated === true,
        lines: response.status === 200 ? response.text.split(/\r\n|\r|\n/) : [],
      };
      if (isChallenge(response))
        return this.refuse(
          'SITE_BLOCKED',
          `robots.txt answered a bot challenge (HTTP ${response.status}).`,
        );
      if (response.status >= 500 || response.status === 429)
        return this.refuse(
          'ROBOTS_UNAVAILABLE',
          `robots.txt answered HTTP ${response.status}.`,
        );
      if (response.truncated)
        this.logger.warn(
          { origin },
          'robots.txt is past 500 KiB; read up to the limit, as Google does',
        );
      return {
        robots:
          response.status === 200
            ? RobotsPolicy.parse(`${origin}/robots.txt`, response.text)
            : RobotsPolicy.allowAll(),
      };
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      this.logger.warn({ origin, error: error.name }, 'robots.txt unreachable');
      if (
        error instanceof RemoteApiTimeoutError ||
        error instanceof RemoteApiUnavailableError
      )
        return this.refuse(
          'SITE_UNREACHABLE',
          `robots.txt could not be fetched (${error.message}); an unreachable robots.txt forbids everything (RFC 9309), so nothing else was requested.`,
        );
      return { robots: RobotsPolicy.allowAll() };
    }
  }

  /** Stopped before anything else is read: no robots rules apply to nothing. */
  private refuse(
    errorCode: TDiscoveryFailure['errorCode'],
    detail: string,
  ): TDiscoveryFailure {
    return { ok: false, robots: RobotsPolicy.allowAll(), errorCode, detail };
  }

  /** A home page that redirects off the site says the site has moved. */
  private async readHome(
    origin: string,
    siteKey: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<string | null> {
    const response = await this.fetchHtml(`${origin}/`, state, signal);
    if (response && !isSameSite(response.finalUrl, siteKey))
      state.redirectedTo = response.finalUrl;
    return response?.status === 200 ? response.text : null;
  }

  /** Every HTML answer a source asks for passes here, so the walk counts it. */
  private async fetchHtml(
    url: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<Pick<ISiteResponse, 'status' | 'text' | 'finalUrl'> | null> {
    try {
      const response = await this.http.getHtml(url, signal);
      state.answered += 1;
      if (isRefusal(response)) state.refused += 1;
      if (response.status === 200) state.usable += 1;
      return response;
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      state.refused += 1;
      return null;
    }
  }

  /** The usual addresses, in order; the first one that is a sitemap is the root. */
  private async probeWellKnown(
    origin: string,
    siteKey: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<void> {
    for (const path of WELL_KNOWN_SITEMAP_PATHS) {
      const url = `${origin}${path}`;
      state.seen.add(url);
      const parsed = await this.fetchSitemap(url, state, signal);
      if (parsed && parsed.kind !== 'invalid') {
        this.absorb(url, parsed, 0, state.seq++, siteKey, state);
        return;
      }
    }
  }

  /** Most promising name first, so the fetch budget is spent on likely blogs. */
  private async walk(
    siteKey: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<void> {
    while (state.pending.length > 0 && state.fetches < SITEMAP_MAX_FETCHES) {
      state.pending.sort((a, b) => b.priority - a.priority || a.seq - b.seq);
      const next = state.pending.shift()!;
      const parsed = await this.fetchSitemap(next.url, state, signal);
      if (parsed)
        this.absorb(next.url, parsed, next.depth, next.seq, siteKey, state);
    }
  }

  private absorb(
    url: string,
    parsed: TParsedSitemap,
    depth: number,
    order: number,
    siteKey: string,
    state: IWalkState,
  ): void {
    if (parsed.kind === 'urlset') {
      // A sitemap may list other sites' pages (a sibling locale, a partner); only ours count.
      const urls = parsed.urls.filter((page) => isSameSite(page, siteKey));
      state.leaves.push({ url, urls, order, news: parsed.news });
      for (const page of urls) {
        const lastmod = parsed.lastmods?.[page];
        if (lastmod && !state.lastmods.has(page))
          state.lastmods.set(page, lastmod);
      }
    } else if (parsed.kind === 'index' && depth + 1 < SITEMAP_MAX_DEPTH) {
      parsed.sitemaps
        .map((child) => resolve(child, url))
        .filter(
          (child): child is string =>
            child !== null && isSiteHost(child, siteKey),
        )
        .forEach((child) => this.enqueue(state, child, depth + 1, siteKey));
    }
  }

  private enqueue(
    state: IWalkState,
    url: string,
    depth: number,
    siteKey: string,
  ): void {
    if (state.seen.has(url)) return;
    state.seen.add(url);
    state.pending.push({
      url,
      depth,
      seq: state.seq++,
      priority:
        nameScoreOf(url, siteKey).score +
        (isSameSite(url, siteKey) ? 0 : OTHER_HOST_PRIORITY),
    });
  }

  private async fetchSitemap(
    url: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<TParsedSitemap | null> {
    state.fetches += 1;
    try {
      const response = await this.http.getSitemap(url, signal);
      state.answered += 1;
      if (isRefusal(response)) state.refused += 1;
      if (response.status !== 200) return null;
      state.usable += 1;
      const parsed = parseSitemap(response.text);
      if (parsed.kind === 'invalid' && parseFeedLinks(response.text) !== null) {
        // Read where feeds are read, as a feed: its items are posts by definition.
        state.feeds.push(url);
        return null;
      }
      return parsed;
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      state.refused += 1;
      this.logger.warn({ url, error: error.name }, 'sitemap unreachable');
      return null;
    }
  }
}

/** A refusing status, or a bot challenge page whatever its status. */
function isRefusal(response: ISiteResponse): boolean {
  return REFUSAL_STATUSES.has(response.status) || isChallenge(response);
}

function isChallenge(response: ISiteResponse): boolean {
  return isBotChallenge(response.headers);
}

/** robots.txt may name a sitemap by a relative path (`Sitemap: /sitemap.xml`). */
function resolve(raw: string, base: string): string | null {
  try {
    return new URL(raw.trim(), base).href;
  } catch {
    return null;
  }
}

/**
 * The site itself or one of its subdomains — sitemaps may be served from
 * `sitemap.example.com` for `example.com`. The pages they list are still filtered to
 * the site.
 */
function isSiteHost(url: string, siteKey: string): boolean {
  try {
    const host = siteKeyOf(new URL(url).hostname);
    return host === siteKey || host.endsWith(`.${siteKey}`);
  } catch {
    return false;
  }
}
