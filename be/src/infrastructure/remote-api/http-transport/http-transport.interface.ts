export interface IHttpRequest {
  url: string;
  headers: Record<string, string>;
  signal: AbortSignal;
  /** Reading stops, with RemoteApiTooLargeError, once the body passes this size. */
  maxBytes: number;
}

export interface IHttpResponse {
  status: number;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  body: Buffer;
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
