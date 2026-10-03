import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { isPublicAddress } from '../address-guard/address-guard';
import { RemoteApiForbiddenAddressError } from '../remote-api.errors';

export type TResolveAll = (hostname: string) => Promise<LookupAddress[]>;

type TLookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

const resolveAllWithDns: TResolveAll = (hostname) =>
  new Promise((resolve, reject) => {
    dnsLookup(hostname, { all: true }, (error, addresses) =>
      error ? reject(error) : resolve(addresses),
    );
  });

/**
 * A `lookup` for the HTTP agent's sockets: it resolves the host, refuses if ANY address
 * is non-public, and hands the socket exactly the address it checked. Checking the name
 * first and connecting later would leave a window for DNS rebinding; here the check and
 * the connection use one answer.
 */
export function createGuardedLookup(
  resolveAll: TResolveAll = resolveAllWithDns,
) {
  return (
    hostname: string,
    options: { all?: boolean },
    callback: TLookupCallback,
  ): void => {
    resolveAll(hostname).then(
      (addresses) => {
        const forbidden = addresses.find(
          ({ address }) => !isPublicAddress(address),
        );
        if (addresses.length === 0 || forbidden) {
          callback(
            new RemoteApiForbiddenAddressError(
              `${hostname} (${forbidden?.address ?? 'no address'})`,
            ),
            '',
          );
          return;
        }
        if (options.all) {
          callback(null, addresses);
          return;
        }
        callback(null, addresses[0].address, addresses[0].family);
      },
      (error: NodeJS.ErrnoException) => callback(error, ''),
    );
  };
}
