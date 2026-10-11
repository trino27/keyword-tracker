import { makeCheckInput } from '../_testing/make-check-input';
import { documentFactsOf } from './document-facts';

const facts = (overrides: Parameters<typeof makeCheckInput>[0]) =>
  documentFactsOf(makeCheckInput(overrides));

describe('documentFactsOf', () => {
  it('reads noindex from meta robots, googlebot and X-Robots-Tag', () => {
    expect(facts({ parsed: { metaRobots: ['noindex, follow'] } }).noindex).toBe(
      true,
    );
    expect(facts({ parsed: { metaGooglebot: ['none'] } }).noindex).toBe(true);
    expect(
      facts({
        headers: { 'content-type': 'text/html', 'x-robots-tag': 'noindex' },
      }).noindex,
    ).toBe(true);
    expect(facts({}).noindex).toBe(false);
  });

  it('reads the first declared canonical, the Link header included', () => {
    expect(
      facts({
        parsed: {
          canonicals: ['https://a.example/one/', 'https://a.example/two/'],
        },
      }).canonical,
    ).toBe('https://a.example/one/');
    expect(
      facts({
        headers: { link: '<https://a.example/h/>; rel="canonical"' },
        parsed: { canonicals: [] },
      }).canonical,
    ).toBe('https://a.example/h/');
    expect(facts({ parsed: { canonicals: [] } }).canonical).toBeNull();
  });

  it('keeps the alternates', () => {
    const alternates = [
      { lang: 'de', href: 'https://a.example/de/post/' },
      { lang: 'x-default', href: 'https://a.example/post/' },
    ];

    expect(facts({ parsed: { alternates } }).alternates).toEqual(alternates);
  });
});
