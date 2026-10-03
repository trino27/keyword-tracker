import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { isSameSite, type TCrawlRunErrorCode } from '@app/contracts';
import { RemoteApiError } from '@infrastructure/remote-api/remote-api.errors';
import {
  SITEMAP_MAX_DEPTH,
  SITEMAP_MAX_FETCHES,
  WELL_KNOWN_SITEMAP_PATHS,
} from '../../constants/sitemap-scoring.constant';
import { FeedDiscoveryService } from '../feed-discovery/feed-discovery.service';
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
      sitemapUrls: string[];
      /** Same-site, deduplicated, in sitemap order — the post candidates. */
      urls: string[];
      reason: string;
    }
  | {
      ok: false;
      robots: RobotsPolicy;
      errorCode: Extract<
        TCrawlRunErrorCode,
        'SITEMAP_NOT_FOUND' | 'BLOG_SITEMAP_NOT_FOUND' | 'SITE_UNREACHABLE'
      >;
      detail: string;
    };

interface IPending {
  url: string;
  depth: number;
  seq: number;
  priority: number;
}

/** Network-level outcome of one fetch: answered (any status) or not reached at all. */
interface IWalkState {
  fetches: number;
  answered: number;
  seq: number;
  seen: Set<string>;
  pending: IPending[];
  leaves: ISitemapLeaf[];
}

/**
 * Finds the blog's sitemap without knowing the site (§10.1). No post page is fetched
 * here: only robots.txt, sitemaps, the home page and feeds — the selection is decided
 * before a single candidate is read.
 */
@Injectable()
export class SitemapDiscoveryService {
  constructor(
    private readonly http: SiteHttpClient,
    private readonly feeds: FeedDiscoveryService,
    @InjectPinoLogger(SitemapDiscoveryService.name)
    private readonly logger: PinoLogger,
  ) {}

  async discover(
    target: IDiscoveryTarget,
    signal: AbortSignal,
  ): Promise<TSitemapDiscovery> {
    const origin = target.websiteUrl.replace(/\/+$/, '');
    const state: IWalkState = {
      fetches: 0,
      answered: 0,
      seq: 0,
      seen: new Set(),
      pending: [],
      leaves: [],
    };

    const robots = await this.readRobots(origin, state, signal);
    const declared = robots
      .sitemaps()
      .filter((url) => isSameSite(url, target.siteKey));

    if (declared.length > 0) {
      declared.forEach((url) => this.enqueue(state, url, 0));
    } else {
      await this.probeWellKnown(origin, target.siteKey, state, signal);
    }
    await this.walk(target.siteKey, state, signal);

    const home = await this.readHome(origin, state, signal);
    if (state.leaves.length === 0) {
      const unreachable = state.answered === 0;
      return {
        ok: false,
        robots,
        errorCode: unreachable ? 'SITE_UNREACHABLE' : 'SITEMAP_NOT_FOUND',
        detail: unreachable
          ? `No answer from ${origin}.`
          : `No sitemap found in robots.txt or at ${WELL_KNOWN_SITEMAP_PATHS.join(', ')}.`,
      };
    }

    const feed = await this.feeds.discover(
      origin,
      target.siteKey,
      home,
      signal,
    );
    const selection = selectBlogGroup(groupSitemaps(state.leaves), feed.keys);
    if (!selection.ok) {
      return {
        ok: false,
        robots,
        errorCode: 'BLOG_SITEMAP_NOT_FOUND',
        detail: `${state.leaves.length} sitemaps read; the best scored ${selection.best?.score.toFixed(2) ?? 0}, below the threshold.`,
      };
    }

    const { group } = selection.winner;
    const urls = [
      ...new Set(group.urls.filter((url) => isSameSite(url, target.siteKey))),
    ];
    this.logger.info(
      {
        siteKey: target.siteKey,
        sitemaps: group.sitemapUrls,
        urls: urls.length,
      },
      'blog sitemap selected',
    );
    return {
      ok: true,
      robots,
      sitemapUrls: group.sitemapUrls,
      urls,
      reason: selection.reason,
    };
  }

  private async readRobots(
    origin: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<RobotsPolicy> {
    try {
      const response = await this.http.getRobots(origin, signal);
      state.answered += 1;
      return response.status === 200
        ? RobotsPolicy.parse(`${origin}/robots.txt`, response.text)
        : RobotsPolicy.allowAll();
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      this.logger.warn({ origin, error: error.name }, 'robots.txt unreachable');
      return RobotsPolicy.allowAll();
    }
  }

  private async readHome(
    origin: string,
    state: IWalkState,
    signal: AbortSignal,
  ): Promise<string | null> {
    try {
      const response = await this.http.getHtml(`${origin}/`, signal);
      state.answered += 1;
      return response.status === 200 ? response.text : null;
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
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
      state.leaves.push({ url, urls: parsed.urls, order });
    } else if (parsed.kind === 'index' && depth + 1 < SITEMAP_MAX_DEPTH) {
      parsed.sitemaps
        .filter((child) => isSameSite(child, siteKey))
        .forEach((child) => this.enqueue(state, child, depth + 1));
    }
  }

  private enqueue(state: IWalkState, url: string, depth: number): void {
    if (state.seen.has(url)) return;
    state.seen.add(url);
    state.pending.push({
      url,
      depth,
      seq: state.seq++,
      priority: nameScoreOf(url).score,
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
      return response.status === 200 ? parseSitemap(response.text) : null;
    } catch (error) {
      if (!(error instanceof RemoteApiError)) throw error;
      this.logger.warn({ url, error: error.name }, 'sitemap unreachable');
      return null;
    }
  }
}
