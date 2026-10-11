import {
  RemoteApiForbiddenAddressError,
  RemoteApiTimeoutError,
  RemoteApiTooManyRedirectsError,
} from '../remote-api.errors';

/**
 * What kind of failure a request met, as far as it says anything about the target:
 * `nxdomain` is the one that does — the name does not exist — and a link check reports
 * it as broken. Every other kind is the network's or the crawler's, and says nothing.
 */
export type TRemoteFailureKind =
  'nxdomain' | 'timeout' | 'tooManyRedirects' | 'forbiddenAddress' | 'network';

/** How deep a cause chain is read: undici wraps the lookup's error once or twice. */
const MAX_CAUSE_DEPTH = 4;

function* causes(error: unknown): Generator<unknown> {
  let current: unknown = error;
  for (let depth = 0; current && depth <= MAX_CAUSE_DEPTH; depth += 1) {
    yield current;
    current = (current as { cause?: unknown }).cause;
  }
}

/**
 * Names the failure. `ENOTFOUND` is the resolver saying the name has no address;
 * `EAI_AGAIN` is the resolver failing to answer, which is the network's fault, so only
 * the first counts as nxdomain.
 */
export function remoteFailureKind(error: unknown): TRemoteFailureKind {
  for (const cause of causes(error)) {
    if (cause instanceof RemoteApiTimeoutError) return 'timeout';
    if (cause instanceof RemoteApiTooManyRedirectsError)
      return 'tooManyRedirects';
    if (cause instanceof RemoteApiForbiddenAddressError)
      return 'forbiddenAddress';
    if ((cause as { code?: unknown }).code === 'ENOTFOUND') return 'nxdomain';
  }
  return 'network';
}
