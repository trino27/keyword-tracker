import { isIP } from 'node:net';
import { siteKeyOf } from '@app/contracts';

/**
 * First labels that name an environment rather than a site. Matched only on hosts of
 * three or more labels — `staging.example.com` — because two-label hosts like `dev.to`
 * are real sites whose name happens to be the word.
 */
const ENVIRONMENT_LABELS = new Set([
  'staging',
  'stage',
  'stg',
  'dev',
  'develop',
  'development',
  'test',
  'testing',
  'qa',
  'uat',
  'preview',
  'sandbox',
]);

/**
 * Hosting platforms' preview and deployment domains. A site may legitimately LIVE on
 * one, so a reference is only flagged when the page itself is served elsewhere.
 */
const PLATFORM_SUFFIXES = [
  '.vercel.app',
  '.netlify.app',
  '.pages.dev',
  '.herokuapp.com',
  '.onrender.com',
  '.fly.dev',
  '.ngrok.io',
  '.ngrok-free.app',
];

const isLocal = (host: string) =>
  host === 'localhost' ||
  host.endsWith('.localhost') ||
  host.endsWith('.local');

/**
 * Whether `host` is a development, staging or preview address, as seen from a page
 * served at `pageHost`. An IP literal counts too: a production page has no reason to
 * name one, and a public IP serving the site is a duplicate host of it.
 */
export function isDevelopmentHost(host: string, pageHost: string): boolean {
  const name = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (name === pageHost.toLowerCase()) return false;
  if (isLocal(name) || isIP(name) !== 0) return true;
  const labels = name.split('.');
  if (labels.length >= 3 && ENVIRONMENT_LABELS.has(labels[0])) return true;
  return PLATFORM_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

const PRIVATE_IP =
  /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|f[cd][0-9a-f]{2}:)/;

/** The site's name without its suffix: `blog.cloudflare.com` → `cloudflare`. */
function brandOf(pageHost: string): string {
  const labels = siteKeyOf(pageHost).split('.').slice(0, -1);
  return labels.reduce((a, b) => (b.length > a.length ? b : a), '');
}

/**
 * Whether `host` is THIS site's development address — the stricter reading a content
 * link or a loaded resource needs. A page links to other people's sites, and theirs
 * may well be `dev.vk.ru` (VK's public developer docs) or `tool.vercel.app` (somebody's
 * deployed app): live addresses that only look like environments. What is this site's
 * own leak: localhost or a private IP, an environment label over this site's own domain
 * (`staging.example.com` from `www.example.com`), or a platform preview named after the
 * site (`example-git-main.vercel.app`).
 */
export function isOwnDevelopmentHost(host: string, pageHost: string): boolean {
  const name = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (name === pageHost.toLowerCase()) return false;
  if (isLocal(name)) return true;
  if (isIP(name) !== 0) return PRIVATE_IP.test(name);
  const brand = brandOf(pageHost);
  const labels = name.split('.');
  if (labels.length >= 3 && ENVIRONMENT_LABELS.has(labels[0]))
    return labels.slice(1, -1).includes(brand);
  return (
    brand.length >= 4 &&
    PLATFORM_SUFFIXES.some((suffix) => name.endsWith(suffix)) &&
    labels[0].includes(brand)
  );
}
