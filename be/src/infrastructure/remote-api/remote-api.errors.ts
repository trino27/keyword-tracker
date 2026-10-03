/** Base of every failure of an outbound request; `retryable` drives RemoteApiCore. */
export class RemoteApiError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** No answer within the per-request timeout. */
export class RemoteApiTimeoutError extends RemoteApiError {
  constructor(url: string) {
    super(`Timed out fetching ${url}`, true);
  }
}

/** The network failed (DNS, connection reset, TLS) — worth retrying. */
export class RemoteApiUnavailableError extends RemoteApiError {
  constructor(url: string, cause: unknown) {
    super(`Could not reach ${url}`, true, { cause });
  }
}

/** The target resolves to, or is, a non-public address. Never retried. */
export class RemoteApiForbiddenAddressError extends RemoteApiError {
  constructor(target: string) {
    super(`Refusing to connect to a non-public address: ${target}`, false);
  }
}

/** The body grew past the size cap; reading stopped there. */
export class RemoteApiTooLargeError extends RemoteApiError {
  constructor(url: string, maxBytes: number) {
    super(`${url} is larger than ${maxBytes} bytes`, false);
  }
}

export class RemoteApiTooManyRedirectsError extends RemoteApiError {
  constructor(url: string) {
    super(`Too many redirects starting at ${url}`, false);
  }
}
