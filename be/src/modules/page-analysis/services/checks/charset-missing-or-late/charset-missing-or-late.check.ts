import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/** The HTML standard's limit: the declaration must be complete within this many bytes. */
const DECLARATION_LIMIT = 1024;

const CHARSET_PARAMETER = /;\s*charset\s*=\s*"?([^";\s]+)/i;

/**
 * Whether a browser is told the encoding before it has to guess. The Content-Type
 * header's charset settles it on its own; otherwise the `<meta charset>` must end within
 * the first 1024 bytes.
 *
 * Always applicable: every HTML response has an encoding, declared or not.
 */
export const CHARSET_MISSING_OR_LATE_CHECK = defineCheck(
  'CHARSET_MISSING_OR_LATE',
  ({ headers, parsed }) => {
    const contentType = headers['content-type'] ?? '';
    if (CHARSET_PARAMETER.test(contentType)) return PASS;
    const end = parsed.charsetDeclarationEnd;
    if (end !== null && end <= DECLARATION_LIMIT) return PASS;
    return fails({
      declarationEnd: end,
      evidence: evidence([
        contentType
          ? `Content-Type: ${contentType} — no charset`
          : 'No Content-Type header',
        end === null
          ? 'No <meta charset> anywhere in the HTML'
          : `<meta charset> ends at byte ${end.toLocaleString('en-US')}, past the first ${DECLARATION_LIMIT}`,
      ]),
    });
  },
);
