import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

const MAX_HTML_BYTES = SEO_ISSUE_CATALOGUE.LARGE_PAGE.max;

export const LARGE_PAGE_CHECK = defineCheck('LARGE_PAGE', ({ htmlBytes }) =>
  htmlBytes > MAX_HTML_BYTES
    ? fails({
        value: htmlBytes,
        max: MAX_HTML_BYTES,
        evidence: evidence([
          `${htmlBytes.toLocaleString('en-US')} bytes of HTML, decompressed — Googlebot stops reading at 2,097,152`,
        ]),
      })
    : PASS,
);
