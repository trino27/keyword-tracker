/**
 * Records real PageSpeed Insights answers into `pagespeed/`, replacing the
 * `*.synthesized.json` success answers the tests use until a key is at hand.
 *
 *   PAGESPEED_API_KEY=… node be/test/fixtures/record-pagespeed-fixtures.ts
 *
 * What exists today and why: `rate-limited.json` and `key-invalid.json` were recorded on
 * 2026-10-10 without a key (a keyless request's daily quota is zero) and with a made-up
 * one. The success answers were built from Google's documented response format, because
 * no key was available; `extract-measurement.spec.ts` pins the shape they assume.
 *
 * The key goes in the `x-goog-api-key` header, as the app sends it, and a file that
 * would contain it is refused rather than written.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/** A page with its own field data, a fresh page with only the site's, and a tiny site. */
const TARGETS: Record<string, string> = {
  'url-field.json': 'https://yoast.com/how-to-remove-www-from-your-url/',
  'origin-only.json': 'https://yoast.com/',
  'lab-only.json': 'https://example.com/',
};

async function main(): Promise<void> {
  const key = process.env.PAGESPEED_API_KEY?.trim();
  if (!key) throw new Error('Set PAGESPEED_API_KEY to record.');
  for (const [file, url] of Object.entries(TARGETS)) {
    const requestUrl = `${ENDPOINT}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    const response = await fetch(requestUrl, {
      headers: { 'x-goog-api-key': key, accept: 'application/json' },
    });
    const body = await response.text();
    if (body.includes(key))
      throw new Error(`${file}: the answer echoes the key`);
    writeFileSync(join(__dirname, 'pagespeed', file), body);
    console.log(`${file}  ${response.status}  ${body.length} bytes`);
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
