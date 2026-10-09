import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/** The encodings that count as compressed: Google's three, and their newer peers. */
const COMPRESSED = new Set(['gzip', 'x-gzip', 'deflate', 'br', 'zstd']);

/**
 * The crawl asks for every page with `Accept-Encoding: gzip, deflate, br`, as Google's
 * crawlers do, so an answer without a compressing `Content-Encoding` is the server
 * declining to compress — not the crawl failing to ask.
 *
 * Always applicable: every page is fetched the same way.
 */
export const HTML_NOT_COMPRESSED_CHECK = defineCheck(
  'HTML_NOT_COMPRESSED',
  ({ headers }) => {
    const encoding = headers['content-encoding']?.trim().toLowerCase() || null;
    return encoding && COMPRESSED.has(encoding)
      ? PASS
      : fails({
          encoding,
          evidence: evidence([
            'Request: Accept-Encoding: gzip, deflate, br',
            encoding
              ? `Response: Content-Encoding: ${encoding}`
              : 'Response: no Content-Encoding header',
          ]),
        });
  },
);
