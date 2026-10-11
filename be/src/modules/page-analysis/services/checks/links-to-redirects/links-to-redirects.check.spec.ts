import type { TOutboundOutcome } from '../../../interfaces/outbound-facts.interface';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { LINKS_TO_REDIRECTS_CHECK } from './links-to-redirects.check';

const redirecting = (to: string, status = 301): TOutboundOutcome => ({
  kind: 'answered',
  status: 200,
  redirects: [{ url: 'https://a.example/old/', status }],
  finalUrl: to,
});
const direct: TOutboundOutcome = {
  kind: 'answered',
  status: 200,
  redirects: [],
  finalUrl: 'https://a.example/fine/',
};

const page = (outcomes: Record<string, TOutboundOutcome>) =>
  makeCheckInput({
    parsed: { links: Object.keys(outcomes) },
    linkStatuses: {
      links: new Map(Object.entries(outcomes)),
      documents: new Map(),
    },
  });

describe('LINKS_TO_REDIRECTS', () => {
  it('fails an internal link that redirects', () => {
    const verdict = LINKS_TO_REDIRECTS_CHECK.evaluate(
      page({
        'https://a.example/old/': redirecting('https://a.example/new/'),
        'https://a.example/fine/': direct,
      }),
    );

    expect(verdict).toEqual(
      failsWith({ count: 1, links: ['https://a.example/old/'] }),
    );
    expect(evidenceOf(verdict)).toEqual([
      'https://a.example/old/ → https://a.example/new/ (301)',
    ]);
  });

  /**
   * Google: a temporary redirect shows "the source page in search results", so the link
   * already names the URL to link to (semrush.com's /analytics/one2target/ → 302).
   */
  it('passes a temporary redirect, and fails a permanent 308', () => {
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'https://a.example/tool/': redirecting('https://a.example/app/', 302),
          'https://a.example/beta/': redirecting('https://a.example/app/', 307),
        }),
      ),
    ).toEqual(PASSES);
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'https://a.example/plans/pro': redirecting(
            'https://a.example/plans/pro-plan',
            308,
          ),
        }),
      ),
    ).toEqual(failsWith({ count: 1 }));
  });

  /** yoast.com: /out/clicky/ is an affiliate redirect, /eu/cart?add-to-cart= an action. */
  it('leaves out affiliate redirects and cart actions, which redirect by design', () => {
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'https://a.example/out/clicky/': redirecting('https://clicky.com/1'),
          'https://a.example/eu/cart?add-to-cart=109998': redirecting(
            'https://a.example/eu/checkout/',
          ),
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('skips a link INTERNAL_LINK_VARIANTS reports', () => {
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'http://a.example/post-2/': redirecting('https://a.example/post-2/'),
          'https://a.example/fine/': direct,
        }),
      ),
    ).toEqual(PASSES);
  });

  it("skips a link to this site's development host — that is DEVELOPMENT_HOST_REFERENCES's", () => {
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'https://staging.a.example/x/': redirecting('https://a.example/x/'),
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('ignores an external redirect', () => {
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'https://b.example/short': redirecting('https://b.example/long'),
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('is not applicable without checked internal links', () => {
    expect(
      LINKS_TO_REDIRECTS_CHECK.evaluate(
        page({
          'https://a.example/x/': { kind: 'unchecked', reason: 'deadline' },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
