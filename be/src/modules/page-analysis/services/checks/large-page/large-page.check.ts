import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

const MAX_HTML_BYTES = SEO_ISSUE_CATALOGUE.LARGE_PAGE.max;

/** Googlebot: "crawls the first 2MB of a supported file type", uncompressed. */
const GOOGLEBOT_READS = 2 * 1024 * 1024;

/**
 * Fires at half of what Googlebot reads, while there is room to act — and says so plainly
 * when the page is already past that: smashingmagazine.com's author archive is 2.6 MB,
 * and its last 0.5 MB is never indexed.
 */
export const LARGE_PAGE_CHECK = defineCheck('LARGE_PAGE', ({ htmlBytes }) =>
  htmlBytes > MAX_HTML_BYTES
    ? fails({
        value: htmlBytes,
        max: MAX_HTML_BYTES,
        evidence: evidence([
          htmlBytes > GOOGLEBOT_READS
            ? `${htmlBytes.toLocaleString('en-US')} bytes of HTML, decompressed — past the ${GOOGLEBOT_READS.toLocaleString('en-US')} Googlebot reads: the last ${(htmlBytes - GOOGLEBOT_READS).toLocaleString('en-US')} bytes are not indexed`
            : `${htmlBytes.toLocaleString('en-US')} bytes of HTML, decompressed — Googlebot stops reading at ${GOOGLEBOT_READS.toLocaleString('en-US')}`,
        ]),
      })
    : PASS,
);
