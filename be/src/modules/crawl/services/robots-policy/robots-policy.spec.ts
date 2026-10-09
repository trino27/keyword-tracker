import { RobotsPolicy } from './robots-policy';

const ROBOTS_URL = 'https://a.example/robots.txt';

describe('RobotsPolicy', () => {
  it('applies the wildcard group to this crawler', () => {
    const policy = RobotsPolicy.parse(
      ROBOTS_URL,
      'User-agent: *\nDisallow: /private/\n',
    );

    expect(policy.isAllowed('https://a.example/blog/post/')).toBe(true);
    expect(policy.isAllowed('https://a.example/private/x/')).toBe(false);
  });

  it('prefers the group naming this crawler', () => {
    const policy = RobotsPolicy.parse(
      ROBOTS_URL,
      'User-agent: *\nDisallow: /\n\nUser-agent: SeoKeywordTrackerBot\nAllow: /\n',
    );

    expect(policy.isAllowed('https://a.example/blog/post/')).toBe(true);
  });

  it('answers for another crawler by its own group', () => {
    const policy = RobotsPolicy.parse(
      ROBOTS_URL,
      'User-agent: *\nAllow: /\n\nUser-agent: Googlebot\nDisallow: /blog/\n',
    );

    expect(policy.isAllowed('https://a.example/blog/post/')).toBe(true);
    expect(policy.allows('https://a.example/blog/post/', 'Googlebot')).toBe(
      false,
    );
    expect(policy.allows('https://a.example/about/', 'Googlebot')).toBe(true);
    expect(
      policy.matchingRule('https://a.example/blog/post/', 'Googlebot'),
    ).toBe('line 5: Disallow: /blog/');
    expect(
      policy.matchingRule('https://a.example/about/', 'Googlebot'),
    ).toBeNull();
  });

  it('says nothing about a URL on a host it does not govern', () => {
    const policy = RobotsPolicy.parse(
      ROBOTS_URL,
      'User-agent: *\nDisallow: /\n',
    );

    expect(policy.allows('https://cdn.example/a.js', 'Googlebot')).toBeNull();
    expect(
      RobotsPolicy.allowAll().allows('https://a.example/x', 'Googlebot'),
    ).toBe(true);
  });

  it('lists Sitemap lines in file order', () => {
    const policy = RobotsPolicy.parse(
      ROBOTS_URL,
      'Sitemap: https://a.example/one.xml\nUser-agent: *\nSitemap: https://a.example/two.xml\n',
    );

    expect(policy.sitemaps()).toEqual([
      'https://a.example/one.xml',
      'https://a.example/two.xml',
    ]);
  });

  it('allows everything when there is no robots.txt', () => {
    const policy = RobotsPolicy.allowAll();

    expect(policy.isAllowed('https://a.example/anything')).toBe(true);
    expect(policy.sitemaps()).toEqual([]);
  });
});
