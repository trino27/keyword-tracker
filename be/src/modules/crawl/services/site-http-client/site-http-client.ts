import { gunzipSync } from 'node:zlib';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  HTTP_TRANSPORT,
  type IHttpTransport,
} from '@infrastructure/remote-api/http-transport/http-transport.interface';
import {
  RemoteApiCore,
  type IRemoteApiTiming,
  type IRemoteResponse,
} from '@infrastructure/remote-api/remote-api.core';
import { REMOTE_API_TIMING } from '@infrastructure/remote-api/remote-api.constant';
import { RemoteApiTooLargeError } from '@infrastructure/remote-api/remote-api.errors';
import { SITE_FETCH_LIMITS } from '../../constants/site-fetch.constant';

/** A response with its body decoded to text; `bytes` is the decoded body size. */
export interface ISiteResponse extends Omit<IRemoteResponse, 'body'> {
  text: string;
  bytes: number;
}

const GZIP_MAGIC = [0x1f, 0x8b] as const;

/**
 * The crawler's client for one website: per-kind size caps, `.gz` sitemaps inflated
 * under a second cap, bodies decoded by their declared charset. Redirects, retries and
 * the SSRF checks are RemoteApiCore's.
 */
@Injectable()
export class SiteHttpClient extends RemoteApiCore {
  constructor(
    @Inject(HTTP_TRANSPORT) transport: IHttpTransport,
    @InjectPinoLogger(SiteHttpClient.name) logger: PinoLogger,
    @Optional() @Inject(REMOTE_API_TIMING) timing?: IRemoteApiTiming,
  ) {
    super(transport, logger, timing);
  }

  async getRobots(origin: string, signal: AbortSignal): Promise<ISiteResponse> {
    return toText(
      await this.get(`${origin}/robots.txt`, {
        maxBytes: SITE_FETCH_LIMITS.robotsBytes,
        accept: 'text/plain',
        signal,
      }),
    );
  }

  async getSitemap(url: string, signal: AbortSignal): Promise<ISiteResponse> {
    const response = await this.get(url, {
      maxBytes: SITE_FETCH_LIMITS.sitemapDownloadBytes,
      accept: 'application/xml, text/xml;q=0.9, */*;q=0.5',
      signal,
    });
    const body = isGzip(response.body)
      ? inflate(response.body, response.finalUrl)
      : response.body;
    return toText({ ...response, body });
  }

  async getFeed(url: string, signal: AbortSignal): Promise<ISiteResponse> {
    return toText(
      await this.get(url, {
        maxBytes: SITE_FETCH_LIMITS.feedBytes,
        accept:
          'application/rss+xml, application/atom+xml, application/xml;q=0.9',
        signal,
      }),
    );
  }

  async getHtml(url: string, signal: AbortSignal): Promise<ISiteResponse> {
    return toText(
      await this.get(url, {
        maxBytes: SITE_FETCH_LIMITS.htmlBytes,
        accept: 'text/html, application/xhtml+xml;q=0.9, */*;q=0.5',
        signal,
      }),
    );
  }
}

function isGzip(body: Buffer): boolean {
  return body[0] === GZIP_MAGIC[0] && body[1] === GZIP_MAGIC[1];
}

function inflate(body: Buffer, url: string): Buffer {
  try {
    return gunzipSync(body, {
      maxOutputLength: SITE_FETCH_LIMITS.sitemapBytes,
    });
  } catch (error) {
    if (error instanceof RangeError)
      throw new RemoteApiTooLargeError(url, SITE_FETCH_LIMITS.sitemapBytes);
    // A corrupt archive reads as an empty, unparseable sitemap.
    return Buffer.alloc(0);
  }
}

function toText(response: IRemoteResponse): ISiteResponse {
  const { body, ...rest } = response;
  return {
    ...rest,
    text: decode(body, rest.headers['content-type']),
    bytes: body.length,
  };
}

function decode(body: Buffer, contentType: string | undefined): string {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1];
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}
