import { BlockList, isIP } from 'node:net';

/**
 * Every range the crawler must never connect to: private networks, loopback,
 * link-local (169.254.169.254 is the cloud metadata service), carrier-grade NAT,
 * multicast and reserved space. A website URL is user input; without this, "add a
 * client" is a way to make the server fetch its own neighbours.
 */
const BLOCKED = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  BLOCKED.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
] as const) {
  BLOCKED.addSubnet(network, prefix, 'ipv6');
}

/** `::ffff:10.0.0.1` reaches 10.0.0.1 — judge the IPv4 address it carries. */
const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

export function isPublicAddress(ip: string): boolean {
  const mapped = IPV4_MAPPED.exec(ip);
  if (mapped) return isPublicAddress(mapped[1]);

  const version = isIP(ip);
  if (version === 4) return !BLOCKED.check(ip, 'ipv4');
  if (version === 6) return !BLOCKED.check(ip, 'ipv6');
  return false;
}
