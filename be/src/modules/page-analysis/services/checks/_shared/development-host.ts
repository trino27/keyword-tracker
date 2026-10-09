import { isIP } from 'node:net';

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
