import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

interface ITraceStore {
  traceId: string;
}

const storage = new AsyncLocalStorage<ITraceStore>();

/** The id of the request or job this code is running inside, if any. */
export function currentTraceId(): string | undefined {
  return storage.getStore()?.traceId;
}

/**
 * Runs `work` under a trace id, so every log line it produces carries the same one.
 *
 * Pass the id when the caller already has one — an incoming `X-Request-ID` — and
 * `undefined` to mint one, which is what work starting outside a request does (a crawl
 * run, the seed). Log context only: nothing branches on this value.
 */
export function runWithTraceId<T>(
  traceId: string | undefined,
  work: () => T,
): T {
  return storage.run({ traceId: traceId ?? randomUUID() }, work);
}
