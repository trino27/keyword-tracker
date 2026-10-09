import { evidence } from '../_shared/evidence';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * A JSON-LD block that is not JSON. Nothing in it reaches Google, so the markup it was
 * written to carry is absent however complete it looks in the source.
 *
 * Not applicable without any JSON-LD: STRUCTURED_DATA_MISSING speaks for that page.
 */
export const STRUCTURED_DATA_INVALID_CHECK = defineCheck(
  'STRUCTURED_DATA_INVALID',
  ({ parsed }) => {
    const { jsonLdErrors, jsonLd } = parsed;
    if (jsonLdErrors.length === 0 && jsonLd.types.length === 0)
      return NOT_APPLICABLE;
    return jsonLdErrors.length === 0
      ? PASS
      : fails({
          count: jsonLdErrors.length,
          evidence: evidence(jsonLdErrors),
        });
  },
);
