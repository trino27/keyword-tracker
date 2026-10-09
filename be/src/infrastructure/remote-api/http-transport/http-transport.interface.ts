export interface IHttpRequest {
  url: string;
  headers: Record<string, string>;
  signal: AbortSignal;
  /** Reading stops, with RemoteApiTooLargeError, once the body passes this size. */
  maxBytes: number;
  /**
   * `truncate` keeps the first `maxBytes` and stops reading instead of failing — for a
   * file whose consumers read only its beginning anyway, as Google reads only the first
   * 500 KiB of a robots.txt. Absent means the ordinary thing: too large is an error.
   */
  overflow?: 'truncate';
}

export interface IHttpResponse {
  status: number;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  body: Buffer;
  /** The body was cut at `maxBytes` (only with `overflow: 'truncate'`). */
  truncated?: boolean;
  /** Time to the response head. A fact of this fetch, stored on the page. */
  ttfbMs: number;
}

/**
 * One HTTP hop: no redirect following, no retries — RemoteApiCore owns both, so every
 * hop of a redirect chain passes the same URL checks.
 */
export interface IHttpTransport {
  send(request: IHttpRequest): Promise<IHttpResponse>;
  /** Releases the connection pool, if the implementation keeps one. */
  close?(): Promise<void>;
}

export const HTTP_TRANSPORT = Symbol('HTTP_TRANSPORT');
