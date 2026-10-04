import { sameDocument } from '../_shared/same-document';
import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/** Without a canonical there is no claim to disagree with, only CANONICAL_MISSING. */
export const CANONICAL_MISMATCH_CHECK = defineCheck(
  'CANONICAL_MISMATCH',
  ({ parsed, finalUrl }) => {
    if (parsed.canonical === null) return NOT_APPLICABLE;
    return sameDocument(parsed.canonical, finalUrl)
      ? PASS
      : fails({ canonical: parsed.canonical, url: finalUrl });
  },
);
