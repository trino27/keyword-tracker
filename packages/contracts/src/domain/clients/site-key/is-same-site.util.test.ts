import { describe, expect, it } from 'vitest';
import { isSameSite } from './is-same-site.util';

describe('isSameSite', () => {
  it.each([
    ['https://www.semrush.com/blog/x/', 'semrush.com', true],
    ['https://semrush.com/blog/x/', 'semrush.com', true],
    ['http://SEMRUSH.com/', 'semrush.com', true],
    ['https://de.semrush.com/blog/x/', 'semrush.com', false],
    ['https://yoast.com/x/', 'semrush.com', false],
    ['not a url', 'semrush.com', false],
  ])('%s on %s → %s', (url, siteKey, expected) => {
    expect(isSameSite(url, siteKey)).toBe(expected);
  });
});
