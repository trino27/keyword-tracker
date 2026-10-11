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
