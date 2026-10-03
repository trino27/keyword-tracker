import { isIP } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { isPublicAddress } from './address-guard/address-guard';
import {
  HTTP_TRANSPORT,
  type IHttpResponse,
  type IHttpTransport,
} from './http-transport/http-transport.interface';
import {
  CRAWLER_USER_AGENT,
  REMOTE_API_LIMITS,
  REMOTE_API_TIMING,
  RETRYABLE_STATUSES,
} from './remote-api.constant';
import {
  RemoteApiError,
  RemoteApiForbiddenAddressError,
  RemoteApiTooManyRedirectsError,
} from './remote-api.errors';

export interface IRemoteGetOptions {
  maxBytes: number;
  accept?: string;
  /** The caller's own cancellation — a lost crawl lease aborts every request it owns. */
  signal?: AbortSignal;
}

export interface IRemoteResponse extends IHttpResponse {
  /** The URL asked for. */
  url: string;
  /** The URL that answered, after redirects. */
  finalUrl: string;
  redirected: boolean;
}

export interface IRemoteApiTiming {
  sleep(ms: number): Promise<void>;
}

const REAL_TIMING: IRemoteApiTiming = { sleep: (ms) => delay(ms) };

/**
 * Policy over a single-hop transport: redirects are followed here, one hop at a time,
 * so each hop's URL is checked before it is requested — a public page redirecting to
 * 169.254.169.254 never reaches the socket. Retries cover the network and the
 * "try again" statuses only; a 404 is an answer.
 */
@Injectable()
export class RemoteApiCore {
  private readonly timing: IRemoteApiTiming;

  constructor(
    @Inject(HTTP_TRANSPORT) private readonly transport: IHttpTransport,
    @InjectPinoLogger(RemoteApiCore.name) private readonly logger: PinoLogger,
    @Optional() @Inject(REMOTE_API_TIMING) timing?: IRemoteApiTiming,
  ) {
    this.timing = timing ?? REAL_TIMING;
  }

  async get(url: string, options: IRemoteGetOptions): Promise<IRemoteResponse> {
    let current = assertFetchable(url);
    for (let hop = 0; hop <= REMOTE_API_LIMITS.maxRedirects; hop += 1) {
      const response = await this.sendWithRetries(current, options);
      const location = response.headers.location;
      if (!isRedirect(response.status) || !location) {
        return {
          ...response,
          url,
          finalUrl: current.href,
          redirected: current.href !== new URL(url).href,
        };
      }
      current = assertFetchable(new URL(location, current).href);
    }
    throw new RemoteApiTooManyRedirectsError(url);
  }

  private async sendWithRetries(
    url: URL,
    options: IRemoteGetOptions,
  ): Promise<IHttpResponse> {
    for (let attempt = 0; ; attempt += 1) {
      const isLast = attempt === REMOTE_API_LIMITS.maxRetries;
      const startedAt = performance.now();
      let retryAfter: string | undefined;
      try {
        const response = await this.transport.send({
          url: url.href,
          headers: {
            'user-agent': CRAWLER_USER_AGENT,
            accept: options.accept ?? '*/*',
          },
          signal: hopSignal(options.signal),
          maxBytes: options.maxBytes,
        });
        this.logger.debug(
          {
            method: 'GET',
            host: url.host,
            path: url.pathname,
            status: response.status,
            durationMs: Math.round(performance.now() - startedAt),
            attempt,
          },
          'remote request',
        );
        if (isLast || !RETRYABLE_STATUSES.has(response.status)) return response;
        retryAfter = response.headers['retry-after'];
      } catch (error) {
        if (isLast || !(error instanceof RemoteApiError) || !error.retryable)
          throw error;
        if (options.signal?.aborted) throw error;
        this.logger.debug(
          { host: url.host, path: url.pathname, attempt, error: error.name },
          'remote request failed',
        );
      }
      await this.timing.sleep(backoffMs(attempt, retryAfter));
    }
  }
}

function backoffMs(attempt: number, retryAfter: string | undefined): number {
  const jitter = Math.floor(Math.random() * REMOTE_API_LIMITS.backoffJitterMs);
  return (
    parseRetryAfter(retryAfter) ??
    REMOTE_API_LIMITS.backoffBaseMs * 2 ** attempt + jitter
  );
}

/**
 * The checks a URL must pass before ANY hop: http(s), no credentials, and an IP
 * literal must be public. A hostname is checked again at connect time by the guarded
 * lookup — this catches what never reaches DNS.
 */
function assertFetchable(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RemoteApiForbiddenAddressError(raw);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new RemoteApiForbiddenAddressError(raw);
  if (url.username || url.password)
    throw new RemoteApiForbiddenAddressError(url.host);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && !isPublicAddress(host))
    throw new RemoteApiForbiddenAddressError(host);
  return url;
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400 && status !== 304;
}

function hopSignal(caller: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(REMOTE_API_LIMITS.timeoutMs);
  return caller ? AbortSignal.any([caller, timeout]) : timeout;
}

/** Seconds or an HTTP date; capped, because a crawl slot is not worth an hour. */
function parseRetryAfter(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(value) - Date.now();
  if (!Number.isFinite(ms) || ms < 0) return undefined;
  return Math.min(ms, REMOTE_API_LIMITS.retryAfterCapMs);
}
