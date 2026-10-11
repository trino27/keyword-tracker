import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { INTERNAL_LINK_VARIANTS_CHECK } from './internal-link-variants.check';

const withLinks = (...links: string[]) => makeCheckInput({ parsed: { links } });

describe('INTERNAL_LINK_VARIANTS', () => {
  it('passes links to the URL form the site serves', () => {
    expect(
      INTERNAL_LINK_VARIANTS_CHECK.evaluate(
        withLinks('https://a.example/other/', 'https://a.example/x?page=2'),
      ),
    ).toEqual(PASSES);
  });

  it.each([
    [
      'http://a.example/other/',
      'http://a.example/other/ — plain HTTP on an HTTPS site',
    ],
    // Recorded on semrush.com: a post served from www linking to the bare host.
    [
      'https://www.a.example/other/',
      'https://www.a.example/other/ — host www.a.example, while this page is served from a.example',
    ],
    // Recorded on semrush.com: internal links tagged with a campaign.
    [
      'https://a.example/tool?utm_source=blog&utm_medium=post',
      'https://a.example/tool?utm_source=blog&utm_medium=post — tracking parameters utm_source, utm_medium',
    ],
  ])('fails %s, saying why', (href, quoted) => {
    const verdict = INTERNAL_LINK_VARIANTS_CHECK.evaluate(withLinks(href));

    expect(verdict).toEqual(failsWith({ count: 1, total: 1 }));
    expect(evidenceOf(verdict)).toEqual([quoted]);
  });

  // `ref` and `id` are too often real parameters to accuse.
  it('leaves parameters that may be real alone', () => {
    expect(
      INTERNAL_LINK_VARIANTS_CHECK.evaluate(
        withLinks('https://a.example/x?ref=nav&id=3'),
      ),
    ).toEqual(PASSES);
  });

  // cossa.ru, 2026-10-11: http://cossa.ru/74/habrahabr is both a variant and dead. A dead
  // link is BROKEN_LINKS' finding; how its address is written no longer matters.
  it('leaves a link the crawl found broken to BROKEN_LINKS', () => {
    const dead = 'http://a.example/gone/';
    expect(
      INTERNAL_LINK_VARIANTS_CHECK.evaluate(
        makeCheckInput({
          parsed: { links: [dead, 'https://a.example/fine/'] },
          linkStatuses: {
            links: new Map([
              [
                dead,
                {
                  kind: 'answered',
                  status: 404,
                  redirects: [{ url: dead, status: 301 }],
                  finalUrl: 'https://a.example/gone/',
                },
              ],
            ]),
            documents: new Map(),
          },
        }),
      ),
    ).toEqual(PASSES);
  });

  it('cannot be judged without internal links', () => {
    expect(
      INTERNAL_LINK_VARIANTS_CHECK.evaluate(withLinks('https://b.example/')),
    ).toEqual(NOT_APPLICABLE);
  });
});
