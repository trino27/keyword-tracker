import { createGuardedLookup } from '../guarded-lookup/guarded-lookup';
import {
  RemoteApiTimeoutError,
  RemoteApiTooManyRedirectsError,
} from '../remote-api.errors';
import { UndiciHttpTransport } from '../undici-http-transport/undici-http-transport';
import { remoteFailureKind } from './remote-failure-kind';

/** A DNS failure as `dns.lookup` reports it. */
const dnsError = (code: string) =>
  Object.assign(new Error(`getaddrinfo ${code} gone.example`), { code });

/** What the real transport throws when the guarded lookup meets `resolveAll`'s answer. */
async function failureOf(
  resolveAll: Parameters<typeof createGuardedLookup>[0],
): Promise<unknown> {
  const transport = new UndiciHttpTransport(createGuardedLookup(resolveAll));
  try {
    await transport.send({
      url: 'http://gone.example/',
      headers: {},
      signal: AbortSignal.timeout(5_000),
      maxBytes: 0,
      overflow: 'truncate',
    });
    throw new Error('expected the request to fail');
  } catch (error) {
    return error;
  } finally {
    await transport.close();
  }
}

describe('remoteFailureKind', () => {
  // The one failure an external link is reported broken for (plan D3).
  it('a lookup answering ENOTFOUND is nxdomain', async () => {
    expect(
      remoteFailureKind(
        await failureOf(() => Promise.reject(dnsError('ENOTFOUND'))),
      ),
    ).toBe('nxdomain');
  });

  // A resolver that could not answer says nothing about the domain.
  it('EAI_AGAIN is network', async () => {
    expect(
      remoteFailureKind(
        await failureOf(() => Promise.reject(dnsError('EAI_AGAIN'))),
      ),
    ).toBe('network');
  });

  it('a forbidden address is forbiddenAddress', async () => {
    expect(
      remoteFailureKind(
        await failureOf(() =>
          Promise.resolve([{ address: '10.0.0.1', family: 4 }]),
        ),
      ),
    ).toBe('forbiddenAddress');
  });

  it('a timeout is timeout, and a redirect loop tooManyRedirects', () => {
    expect(remoteFailureKind(new RemoteApiTimeoutError('https://a/'))).toBe(
      'timeout',
    );
    expect(
      remoteFailureKind(new RemoteApiTooManyRedirectsError('https://a/')),
    ).toBe('tooManyRedirects');
  });
});
