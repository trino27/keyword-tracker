import { describe, expect, it } from 'vitest';
import { parseWebsiteUrl } from './parse-website-url.util';

describe('parseWebsiteUrl', () => {
  it.each([
    ['yoast.com', 'https://yoast.com', 'yoast.com'],
    ['https://www.semrush.com', 'https://www.semrush.com', 'semrush.com'],
    [
      'https://WWW.Semrush.com:443/blog/?x=1',
      'https://www.semrush.com',
      'semrush.com',
    ],
    ['  http://semrush.com/  ', 'http://semrush.com', 'semrush.com'],
    ['http://bücher.de', 'http://xn--bcher-kva.de', 'xn--bcher-kva.de'],
    ['https://de.semrush.com', 'https://de.semrush.com', 'de.semrush.com'],
    ['https://example.com:8443/x', 'https://example.com:8443', 'example.com'],
  ])('%s → origin %s, site key %s', (input, origin, siteKey) => {
    expect(parseWebsiteUrl(input)).toEqual({ ok: true, origin, siteKey });
  });

  it('keeps subdomains other than www apart: de.semrush.com is another site', () => {
    const blog = parseWebsiteUrl('de.semrush.com');
    const main = parseWebsiteUrl('semrush.com');
    expect(blog.ok && main.ok && blog.siteKey !== main.siteKey).toBe(true);
  });

  it.each([
    ['', 'invalid'],
    ['not a url', 'invalid'],
    ['ftp://a.com', 'unsupported_scheme'],
    ['https://u:p@a.com', 'credentials'],
    ['http://10.0.0.1', 'ip_address'],
    ['http://[::1]', 'ip_address'],
    ['http://localhost', 'local_host'],
    ['http://api.localhost', 'local_host'],
    ['http://intranet', 'local_host'],
  ])('refuses %p (%s)', (input, reason) => {
    expect(parseWebsiteUrl(input)).toEqual({ ok: false, reason });
  });
});
