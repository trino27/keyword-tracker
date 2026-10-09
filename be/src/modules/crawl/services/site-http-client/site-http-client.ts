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

  /**
   * The first 500 KiB of robots.txt, never an error for being longer: Google ignores what
   * follows the limit, so a file past it still governs the crawl by its beginning. A
   * truncated body ends at its last complete line — a rule cut mid-path would be broader
   * than the one written (`Disallow: /admin/` read as `Disallow: /adm`).
   */
  async getRobots(origin: string, signal: AbortSignal): Promise<ISiteResponse> {
    const response = toText(
      await this.get(`${origin}/robots.txt`, {
        maxBytes: SITE_FETCH_LIMITS.robotsBytes,
        overflow: 'truncate',
        accept: 'text/plain',
        signal,
      }),
    );
    if (!response.truncated) return response;
    const lastLine = response.text.lastIndexOf('\n');
    return {
      ...response,
      text: lastLine === -1 ? '' : response.text.slice(0, lastLine + 1),
    };
  }

  /**
   * A request made only to see how the server answers — a host variant, a missing
   * page. The status and the redirects are the answer; the body is read only as far as
   * a small cap and never decoded.
   */
  async probe(url: string, signal: AbortSignal) {
    return this.get(url, {
      maxBytes: SITE_FETCH_LIMITS.probeBytes,
      overflow: 'truncate',
      accept: 'text/html',
      signal,
    });
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
          'application/rss+xml, application/atom+xml, application/feed+json, application/xml;q=0.9',
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

const BOMS: readonly [number[], string][] = [
  [[0xef, 0xbb, 0xbf], 'utf-8'],
  [[0xfe, 0xff], 'utf-16be'],
  [[0xff, 0xfe], 'utf-16le'],
];
/** How far into the body a `<meta charset>` or XML declaration is looked for. */
const PRESCAN_BYTES = 1024;
const DECLARED_CHARSET = [
  /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i,
  /<\?xml[^>]+encoding\s*=\s*["']([\w-]+)/i,
];

/**
 * The HTML standard's order: a byte order mark, then the header's charset, then what
 * the document declares in its first bytes (`<meta charset>`, `http-equiv`, the XML
 * declaration) — many Cyrillic sites declare windows-1251 only in the page.
 */
function decode(body: Buffer, contentType: string | undefined): string {
  const bom = BOMS.find(([bytes]) =>
    bytes.every((byte, i) => body[i] === byte),
  );
  if (bom) return decodeAs(body.subarray(bom[0].length), bom[1]);
  const charset =
    /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1] ??
    declaredCharset(body);
  return decodeAs(body, charset ?? 'utf-8');
}

function declaredCharset(body: Buffer): string | undefined {
  const head = body.subarray(0, PRESCAN_BYTES).toString('latin1');
  for (const pattern of DECLARED_CHARSET) {
    const charset = pattern.exec(head)?.[1];
    if (charset) return charset;
  }
  return undefined;
}

function decodeAs(body: Buffer, charset: string): string {
  try {
    return new TextDecoder(charset, { ignoreBOM: true }).decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}
