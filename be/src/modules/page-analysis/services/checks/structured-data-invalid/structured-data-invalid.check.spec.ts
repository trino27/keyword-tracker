import {
  evidenceOf,
  failsWith,
  NOT_APPLICABLE,
  PASSES,
} from '../_testing/expect-verdict';
import { makeCheckInput } from '../_testing/make-check-input';
import { STRUCTURED_DATA_INVALID_CHECK } from './structured-data-invalid.check';

describe('STRUCTURED_DATA_INVALID', () => {
  it('passes JSON-LD that reads', () => {
    expect(STRUCTURED_DATA_INVALID_CHECK.evaluate(makeCheckInput())).toEqual(
      PASSES,
    );
  });

  it('fails a block that is not JSON, quoting it with the parser error', () => {
    const error =
      '{"@type": "Article",} — Expected double-quoted property name in JSON at position 20';
    const verdict = STRUCTURED_DATA_INVALID_CHECK.evaluate(
      makeCheckInput({
        parsed: {
          jsonLd: { types: [], keywords: [], articleFields: [] },
          jsonLdErrors: [error],
        },
      }),
    );

    expect(verdict).toEqual(failsWith({ count: 1 }));
    expect(evidenceOf(verdict)).toEqual([error]);
  });

  it('cannot be judged on a page with no JSON-LD at all', () => {
    expect(
      STRUCTURED_DATA_INVALID_CHECK.evaluate(
        makeCheckInput({
          parsed: { jsonLd: { types: [], keywords: [], articleFields: [] } },
        }),
      ),
    ).toEqual(NOT_APPLICABLE);
  });
});
