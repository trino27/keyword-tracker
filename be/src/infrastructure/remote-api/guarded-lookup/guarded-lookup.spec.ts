import type { LookupAddress } from 'node:dns';
import { RemoteApiForbiddenAddressError } from '../remote-api.errors';
import { createGuardedLookup, type TResolveAll } from './guarded-lookup';

const resolverReturning =
  (addresses: LookupAddress[]): TResolveAll =>
  () =>
    Promise.resolve(addresses);

const lookupAsPromise = (
  lookup: ReturnType<typeof createGuardedLookup>,
  hostname: string,
) =>
  new Promise<{ address: string; family: number }>((resolve, reject) => {
    lookup(hostname, {}, (error, address, family) =>
      error
        ? reject(error)
        : resolve({ address: address as string, family: family as number }),
    );
  });

describe('createGuardedLookup', () => {
  it('connects to the resolved public address', async () => {
    const lookup = createGuardedLookup(
      resolverReturning([{ address: '93.184.216.34', family: 4 }]),
    );

    await expect(lookupAsPromise(lookup, 'example.com')).resolves.toEqual({
      address: '93.184.216.34',
      family: 4,
    });
  });

  it('refuses a host that resolves to a private address', async () => {
    const lookup = createGuardedLookup(
      resolverReturning([{ address: '10.0.0.5', family: 4 }]),
    );

    await expect(
      lookupAsPromise(lookup, 'internal.example.com'),
    ).rejects.toBeInstanceOf(RemoteApiForbiddenAddressError);
  });

  it('refuses when ANY resolved address is private — no picking the safe one', async () => {
    const lookup = createGuardedLookup(
      resolverReturning([
        { address: '93.184.216.34', family: 4 },
        { address: '127.0.0.1', family: 4 },
      ]),
    );

    await expect(
      lookupAsPromise(lookup, 'rebind.example.com'),
    ).rejects.toBeInstanceOf(RemoteApiForbiddenAddressError);
  });

  it('answers in the all-addresses form when asked for it', async () => {
    const lookup = createGuardedLookup(
      resolverReturning([{ address: '93.184.216.34', family: 4 }]),
    );

    const result = await new Promise<unknown>((resolve, reject) => {
      lookup('example.com', { all: true }, (error, addresses) =>
        error ? reject(error) : resolve(addresses),
      );
    });

    expect(result).toEqual([{ address: '93.184.216.34', family: 4 }]);
  });
});
