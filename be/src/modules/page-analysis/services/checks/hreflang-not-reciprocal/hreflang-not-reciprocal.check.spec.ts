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
import { HREFLANG_NOT_RECIPROCAL_CHECK } from './hreflang-not-reciprocal.check';

const SELF = 'https://a.example/post/';
const DE = 'https://a.example/de/post/';
const FR = 'https://a.example/fr/post/';

const ok = (url: string): TOutboundOutcome => ({
  kind: 'answered',
  status: 200,
  redirects: [],
  finalUrl: url,
});
const naming = (url: string, ...hrefs: string[]): IDocumentFacts => ({
  url,
  outcome: ok(url),
  page: {
    noindex: false,
    canonical: url,
    alternates: hrefs.map((href) => ({ lang: 'en', href })),
  },
});

const page = (
  alternates: { lang: string; href: string }[],
  documents: IDocumentFacts[],
  canonicals = [SELF],
) =>
  makeCheckInput({
    parsed: { alternates, canonicals },
    linkStatuses: {
      links: new Map(),
      documents: new Map(documents.map((document) => [document.url, document])),
    },
  });

const SET = [
  { lang: 'en', href: SELF },
  { lang: 'de', href: DE },
];

describe('HREFLANG_NOT_RECIPROCAL', () => {
  it('fails an alternate that answers 200 and does not name this page', () => {
    const verdict = HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
      page(SET, [naming(DE, DE)]),
    );

    expect(verdict).toEqual(failsWith({ count: 1, alternates: [DE] }));
    expect(evidenceOf(verdict)).toEqual([
      `${DE} (de) lists no hreflang link back to ${SELF}`,
    ]);
  });

  it('passes an alternate that names this page with a trailing-slash difference', () => {
    expect(
      HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
        page(SET, [naming(DE, DE, 'https://a.example/post')]),
      ),
    ).toEqual(PASSES);
  });

  it('does not judge a redirected alternate', () => {
    expect(
      HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
        page(SET, [
          {
            ...naming(DE, DE),
            outcome: {
              kind: 'answered',
              status: 200,
              redirects: [{ url: DE, status: 301 }],
              finalUrl: 'https://a.example/de/new/',
            },
          },
        ]),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('skips x-default', () => {
    expect(
      HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
        page(
          [...SET, { lang: 'x-default', href: FR }],
          [naming(DE, SELF), naming(FR, FR)],
        ),
      ),
    ).toEqual(PASSES);
  });

  it('is not applicable when no alternate could be read', () => {
    expect(HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(page(SET, []))).toEqual(
      NOT_APPLICABLE,
    );
  });

  it('skips an alternate whose code HREFLANG_INVALID reports', () => {
    expect(
      HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
        page(
          [
            { lang: 'en', href: SELF },
            { lang: 'ua', href: DE },
          ],
          [naming(DE, DE)],
        ),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it("skips a development-host alternate — that is DEVELOPMENT_HOST_REFERENCES's", () => {
    const staging = 'https://staging.a.example/de/post/';
    expect(
      HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
        page(
          [
            { lang: 'en', href: SELF },
            { lang: 'de', href: staging },
          ],
          [naming(staging, staging)],
        ),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it("is not applicable when the canonical names another URL — that is HREFLANG_INVALID's", () => {
    expect(
      HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
        page(SET, [naming(DE, DE)], ['https://a.example/original/']),
      ),
    ).toEqual(NOT_APPLICABLE);
  });

  it('says how many alternates it read when it could not read them all', () => {
    const verdict = HREFLANG_NOT_RECIPROCAL_CHECK.evaluate(
      page([...SET, { lang: 'fr', href: FR }], [naming(DE, DE)]),
    );

    expect(evidenceOf(verdict)).toContain('Checked 1 of 2 alternates.');
  });
});
