import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type {
  IHttpRequest,
  IHttpResponse,
  IHttpTransport,
} from '../http-transport/http-transport.interface';
import {
  RemoteApiTimeoutError,
  RemoteApiTooLargeError,
  RemoteApiUnavailableError,
} from '../remote-api.errors';

export type TFixtureError = 'timeout' | 'unavailable';

/** One recorded answer: a file under `sites/`, an inline body, or a network failure. */
export interface IFixtureEntry {
  status: number;
  headers?: Record<string, string>;
  file?: string;
  body?: string;
  ttfbMs?: number;
  error?: TFixtureError;
}

/**
 * Unrecorded URLs matching `pattern` answer with a synthesized article, fail like the
 * network, or answer a bare status (a bot wall's 403).
 */
export interface IFixturePattern {
  pattern: string;
  synthesize?: 'article';
  error?: TFixtureError;
  status?: number;
}

export interface IFixtureManifest {
  entries: Record<string, IFixtureEntry>;
  patterns: IFixturePattern[];
}

export const FIXTURES_ROOT = resolve(__dirname, '../../../../test/fixtures');

const NOT_FOUND: IFixtureEntry = {
  status: 404,
  headers: { 'content-type': 'text/html' },
  body: '<html><head><title>Not found</title></head></html>',
};

/**
 * Serves recorded sites to everything above the transport — RemoteApiCore's redirects
 * and retries run for real. A URL the manifest does not know is a 404, never a network
 * call, so a test can never pass by reaching the live site.
 */
export class FixtureHttpTransport implements IHttpTransport {
  readonly requests: string[] = [];
  private readonly entries: Map<string, IFixtureEntry>;
  private readonly patterns: (IFixturePattern & { regex: RegExp })[];

  constructor(
    manifest: IFixtureManifest = loadFixtureManifest(),
    private readonly root: string = FIXTURES_ROOT,
  ) {
    this.entries = new Map(Object.entries(manifest.entries));
    this.patterns = manifest.patterns.map((pattern) => ({
      ...pattern,
      regex: new RegExp(pattern.pattern),
    }));
  }

  /** Replace or add an answer — how a test changes a site between two crawls. */
  override(url: string, entry: IFixtureEntry): void {
    this.entries.set(url, entry);
  }

  send(request: IHttpRequest): Promise<IHttpResponse> {
    this.requests.push(request.url);
    const entry =
      this.entries.get(request.url) ?? this.fromPattern(request.url);
    if (entry.error === 'timeout')
      return Promise.reject(new RemoteApiTimeoutError(request.url));
    if (entry.error === 'unavailable')
      return Promise.reject(
        new RemoteApiUnavailableError(request.url, new Error('ECONNREFUSED')),
      );
    const body = entry.file
      ? readFileSync(join(this.root, 'sites', entry.file))
      : Buffer.from(entry.body ?? '');
    if (body.length > request.maxBytes)
      return Promise.reject(
        new RemoteApiTooLargeError(request.url, request.maxBytes),
      );
    return Promise.resolve({
      status: entry.status,
      headers: lowerCaseKeys(entry.headers ?? {}),
      body,
      ttfbMs: entry.ttfbMs ?? 50,
    });
  }

  private fromPattern(url: string): IFixtureEntry {
    const match = this.patterns.find(({ regex }) => regex.test(url));
    if (!match) return NOT_FOUND;
    if (match.error) return { status: 0, error: match.error };
    if (match.status !== undefined)
      return {
        status: match.status,
        headers: { 'content-type': 'text/html' },
        body: '<html><head><title>Forbidden</title></head></html>',
      };
    return {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: synthesizedArticle(url),
    };
  }
}

export function loadFixtureManifest(
  root: string = FIXTURES_ROOT,
): IFixtureManifest {
  return JSON.parse(
    readFileSync(join(root, 'manifest.json'), 'utf8'),
  ) as IFixtureManifest;
}

function lowerCaseKeys(
  headers: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
  );
}

function synthesizedArticle(url: string): string {
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() ?? 'post';
  const topic = slug.replace(/[-_]+/g, ' ');
  const paragraph = `This article explains ${topic} in practical terms, with examples a reader can apply. `;
  return [
    '<!doctype html><html lang="en"><head>',
    `<title>${topic} explained</title>`,
    `<meta name="description" content="A practical guide to ${topic}.">`,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="article">',
    '</head><body><main><article>',
    `<h1>${topic} explained</h1>`,
    `<p>${paragraph.repeat(30)}</p>`,
    '</article></main></body></html>',
  ].join('');
}
