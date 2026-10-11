import type {
  IDocumentFacts,
  TOutboundOutcome,
} from '../../../interfaces/outbound-facts.interface';
import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { CANONICAL_TARGET_BROKEN_CHECK } from './canonical-target-broken.check';

const TARGET = 'https://a.example/original/';

const answered = (
  status: number,
  redirects: { url: string; status: number }[] = [],
): TOutboundOutcome => ({
  kind: 'answered',
  status,
  redirects,
  finalUrl: redirects.length > 0 ? 'https://a.example/elsewhere/' : TARGET,
});

const pointingAt = (
  document: Partial<IDocumentFacts> | null,
  canonical = TARGET,
) =>
  makeCheckInput({
    parsed: { canonicals: [canonical] },
    linkStatuses: {
      links: new Map(),
      documents: new Map(
        document
          ? [
              [
                canonical,
                {
                  url: canonical,
                  outcome: answered(200),
                  page: { noindex: false, canonical, alternates: [] },
                  ...document,
                },
              ],
            ]
          : [],
      ),
    },
  });

describe('CANONICAL_TARGET_BROKEN', () => {
  it('passes a canonical naming the page itself; is not applicable without one', () => {
    expect(CANONICAL_TARGET_BROKEN_CHECK.evaluate(makeCheckInput())).toEqual(
      PASSES,
    );
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        makeCheckInput({ parsed: { canonicals: [] } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('is not applicable for an unread target', () => {
    expect(CANONICAL_TARGET_BROKEN_CHECK.evaluate(pointingAt(null))).toEqual(
      NOT_APPLICABLE,
    );
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt({ outcome: { kind: 'unchecked', reason: 'budget' } }),
      ),
    ).toEqual(NOT_APPLICABLE);
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt({ outcome: { kind: 'failed', failure: 'timeout' } }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('fails a redirecting target, quoting the hops', () => {
    const verdict = CANONICAL_TARGET_BROKEN_CHECK.evaluate(
      pointingAt({ outcome: answered(200, [{ url: TARGET, status: 301 }]) }),
    );

    expect(verdict).toEqual(
      failsWith({ canonical: TARGET, problem: 'redirects' }),
    );
    expect(evidenceOf(verdict)).toEqual([
      `<link rel="canonical" href="${TARGET}">`,
      `${TARGET} redirects (301) to https://a.example/elsewhere/`,
    ]);
  });

  it('fails a 404 target', () => {
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt({ outcome: answered(404), page: null }),
      ),
    ).toEqual(failsWith({ problem: 'status', status: 404 }));
  });

  it('fails a noindexed target', () => {
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt({
          page: { noindex: true, canonical: TARGET, alternates: [] },
        }),
      ),
    ).toEqual(failsWith({ problem: 'noindex' }));
  });

  it('fails a chain', () => {
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt({
          page: {
            noindex: false,
            canonical: 'https://a.example/third/',
            alternates: [],
          },
        }),
      ),
    ).toEqual(
      failsWith({ problem: 'chain', next: 'https://a.example/third/' }),
    );
  });

  it('passes a healthy target', () => {
    expect(CANONICAL_TARGET_BROKEN_CHECK.evaluate(pointingAt({}))).toEqual(
      PASSES,
    );
  });

  it('judges a run page from its own facts', () => {
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt({
          outcome: answered(200),
          page: { noindex: true, canonical: TARGET, alternates: [] },
        }),
      ),
    ).toEqual(failsWith({ problem: 'noindex' }));
  });

  it("is not applicable to the http twin — that is CANONICAL_TO_HTTP's", () => {
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt(
          { outcome: answered(200, [{ url: 'x', status: 301 }]) },
          'http://a.example/post/',
        ),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it("is not applicable to a development-host target — that is DEVELOPMENT_HOST_REFERENCES's", () => {
    expect(
      CANONICAL_TARGET_BROKEN_CHECK.evaluate(
        pointingAt(
          { outcome: answered(404), page: null },
          'https://staging.a.example/post/',
        ),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
