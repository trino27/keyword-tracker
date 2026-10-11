import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import {
  HTTP_TRANSPORT,
  type IHttpTransport,
} from '@infrastructure/remote-api/http-transport/http-transport.interface';
import {
  RemoteApiCore,
  type IRemoteApiTiming,
} from '@infrastructure/remote-api/remote-api.core';
import { REMOTE_API_TIMING } from '@infrastructure/remote-api/remote-api.constant';
import {
  PAGE_SPEED_MAX_BYTES,
  PAGE_SPEED_REQUEST_TIMEOUT_MS,
  PSI_ENDPOINT,
} from '../../constants/page-speed-worker.constant';
import type { TPsiCallResult } from '../classify-psi-response/classify-psi-response';

/**
 * Google PageSpeed Insights, mobile: performance, and Lighthouse's SEO and accessibility.
 * One request per call — no retries inside it: the queue owns the retry schedule, in
 * minutes, not milliseconds.
 *
 * The key travels in the `x-goog-api-key` header, never in the query string: the request
 * URL is what error messages, logs and fixtures record, and a key in it would reach all
 * three (plan D23). Google accepts the header — verified 2026-10-10 against the live API.
 */
@Injectable()
export class PsiClient extends RemoteApiCore {
  constructor(
    @Inject(HTTP_TRANSPORT) transport: IHttpTransport,
    @InjectPinoLogger(PsiClient.name) logger: PinoLogger,
    @Optional() @Inject(REMOTE_API_TIMING) timing?: IRemoteApiTiming,
  ) {
    super(transport, logger, timing);
  }

  /**
   * The request URL for a page, parameters in a fixed order so fixtures can key on it.
   * Lighthouse's SEO and accessibility categories ride on the same request: one call, one
   * unit of quota, every verdict (SPEED-016).
   */
  static requestUrl(pageUrl: string): string {
    return `${PSI_ENDPOINT}?url=${encodeURIComponent(pageUrl)}&strategy=mobile&category=performance&category=seo&category=accessibility`;
  }

  /** Never throws for what Google or the network did; the caller classifies the result. */
  async runPagespeed(
    pageUrl: string,
    apiKey: string,
    signal?: AbortSignal,
  ): Promise<TPsiCallResult> {
    try {
      const response = await this.get(PsiClient.requestUrl(pageUrl), {
        maxBytes: PAGE_SPEED_MAX_BYTES,
        accept: 'application/json',
        headers: { 'x-goog-api-key': apiKey },
        timeoutMs: PAGE_SPEED_REQUEST_TIMEOUT_MS,
        maxRetries: 0,
        ...(signal ? { signal } : {}),
      });
      return {
        response: {
          status: response.status,
          headers: response.headers,
          body: response.body,
        },
      };
    } catch (error: unknown) {
      return { error };
    }
  }
}
