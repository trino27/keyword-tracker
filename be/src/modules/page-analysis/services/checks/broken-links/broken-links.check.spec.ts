import type { TOutboundOutcome } from '../../../interfaces/outbound-facts.interface';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { BROKEN_LINKS_CHECK } from './broken-links.check';

const answered = (status: number): TOutboundOutcome => ({
  kind: 'answered',
  status,
  redirects: [],
  finalUrl: 'https://x/',
});

const page = (outcomes: Record<string, TOutboundOutcome | undefined>) =>
  makeCheckInput({
    parsed: { links: Object.keys(outcomes) },
    linkStatuses: {
      links: new Map(
        Object.entries(outcomes).filter(
          (entry): entry is [string, TOutboundOutcome] =>
            entry[1] !== undefined,
        ),
      ),
      documents: new Map(),
    },
  });

describe('BROKEN_LINKS', () => {
  it('fails an internal 500', () => {
    expect(
      BROKEN_LINKS_CHECK.evaluate(
        page({ 'https://a.example/gone/': answered(500) }),
      ),
    ).toEqual(failsWith({ count: 1, links: ['https://a.example/gone/'] }));
  });

  it('fails an external 410', () => {
    expect(
      BROKEN_LINKS_CHECK.evaluate(
        page({ 'https://b.example/old': answered(410) }),
      ),
    ).toEqual(failsWith({ count: 1 }));
  });

  it('passes an external 403', () => {
    expect(
      BROKEN_LINKS_CHECK.evaluate(
        page({ 'https://b.example/walled': answered(403) }),
      ),
    ).toEqual(PASSES);
  });

  it('an unchecked link is neither broken nor fine, and the evidence says checked N of M', () => {
    const verdict = BROKEN_LINKS_CHECK.evaluate(
      page({
        'https://b.example/dead': { kind: 'failed', failure: 'nxdomain' },
        'https://b.example/later': { kind: 'unchecked', reason: 'budget' },
        'https://b.example/never': undefined,
      }),
    );

    expect(verdict).toEqual(failsWith({ count: 1, checked: 1, total: 3 }));
    expect(evidenceOf(verdict)).toEqual([
      'https://b.example/dead — the domain does not exist',
      "Checked 1 of 3 links; the rest could not be asked within the crawl's budget, robots.txt or deadline.",
    ]);
  });

  it('is not applicable when no link could be checked', () => {
    expect(
      BROKEN_LINKS_CHECK.evaluate(
        page({
          'https://b.example/x': { kind: 'unchecked', reason: 'robots' },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
    expect(BROKEN_LINKS_CHECK.evaluate(page({}))).toEqual(NOT_APPLICABLE);
  });

  it("skips a link to this site's development host — that is DEVELOPMENT_HOST_REFERENCES's", () => {
    expect(
      BROKEN_LINKS_CHECK.evaluate(
        page({ 'https://staging.a.example/post/': answered(404) }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
