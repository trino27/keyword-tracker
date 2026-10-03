import { isPublicAddress } from './address-guard';

describe('isPublicAddress', () => {
  it.each(['93.184.216.34', '151.101.1.69', '2606:4700:4700::1111', '8.8.8.8'])(
    'accepts the public address %s',
    (ip) => {
      expect(isPublicAddress(ip)).toBe(true);
    },
  );

  it.each([
    ['0.0.0.0', 'this network'],
    ['10.1.2.3', 'private'],
    ['100.64.0.1', 'carrier-grade NAT'],
    ['127.0.0.1', 'loopback'],
    ['169.254.169.254', 'link-local — the cloud metadata service'],
    ['172.16.0.1', 'private'],
    ['172.31.255.255', 'private'],
    ['192.168.1.1', 'private'],
    ['224.0.0.1', 'multicast'],
    ['255.255.255.255', 'reserved'],
    ['::', 'unspecified'],
    ['::1', 'loopback'],
    ['fc00::1', 'unique local'],
    ['fd12:3456::1', 'unique local'],
    ['fe80::1', 'link-local'],
    ['::ffff:127.0.0.1', 'IPv4-mapped loopback'],
    ['::ffff:10.0.0.1', 'IPv4-mapped private'],
    ['not-an-ip', 'garbage'],
  ])('refuses %s (%s)', (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
});
