import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { NO_EXTERNAL_SOURCES_CHECK } from './no-external-sources.check';

const withLinks = (links: string[], finalUrl = 'https://a.example/post/') =>
  makeCheckInput({ finalUrl, parsed: { links } });

describe('NO_EXTERNAL_SOURCES', () => {
  it('passes a post that links to another site', () => {
    expect(
      NO_EXTERNAL_SOURCES_CHECK.evaluate(
        withLinks(['https://a.example/other/', 'https://study.example/report']),
      ),
    ).toEqual(PASSES);
  });

  it('fails a post whose links all stay on the site, quoting one', () => {
    const verdict = NO_EXTERNAL_SOURCES_CHECK.evaluate(
      withLinks(['https://a.example/other/', 'https://www.a.example/pricing/']),
    );

    expect(verdict).toEqual(failsWith({ words: 800, links: 2 }));
    expect(evidenceOf(verdict)).toEqual([
      '2 links in the content, all to this site, e.g. <a href="https://a.example/other/">',
    ]);
  });

  it('fails a post that links nowhere at all', () => {
    const verdict = NO_EXTERNAL_SOURCES_CHECK.evaluate(withLinks([]));

    expect(verdict).toEqual(failsWith({ links: 0 }));
    expect(evidenceOf(verdict)).toEqual(['No <a href> in the main content']);
  });

  // The blog and the company are one organisation: linking to its own pricing page from
  // its blog subdomain cites nothing.
  it.each([
    [
      'the parent domain',
      'https://blog.a.example/post/',
      'https://a.example/pricing/',
    ],
    ['a subdomain', 'https://a.example/post/', 'https://docs.a.example/api/'],
    // blog.hubspot.com linking to cta-redirect.hubspot.com: a sibling, not a source.
    [
      'a sibling subdomain',
      'https://blog.a.example/post/',
      'https://cta.a.example/redirect/1',
    ],
    [
      'a sibling under a country code',
      'https://blog.a.co.uk/post/',
      'https://shop.a.co.uk/x',
    ],
  ])("counts %s as the site's own", (_, finalUrl, link) => {
    expect(
      NO_EXTERNAL_SOURCES_CHECK.evaluate(withLinks([link], finalUrl)),
    ).toEqual(failsWith({ links: 1 }));
  });

  // A host ending in the site's name is not its subdomain, and another registrant under
  // the same country code is another organisation.
  it.each([
    ['https://a.example/post/', 'https://nota.example/x'],
    ['https://blog.a.co.uk/post/', 'https://b.co.uk/report'],
  ])('does not take %s and %s for one site', (finalUrl, link) => {
    expect(
      NO_EXTERNAL_SOURCES_CHECK.evaluate(withLinks([link], finalUrl)),
    ).toEqual(PASSES);
  });

  it.each([
    [299, NOT_APPLICABLE],
    [300, failsWith({ words: 300 })],
  ])('at %d words', (wordCount, expected) => {
    expect(
      NO_EXTERNAL_SOURCES_CHECK.evaluate(
        makeCheckInput({ parsed: { links: [], wordCount } }),
      ),
    ).toEqual(expected);
  });
});
