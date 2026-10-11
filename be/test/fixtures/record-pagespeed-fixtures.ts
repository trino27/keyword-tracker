/**
 * Records real PageSpeed Insights answers into `pagespeed/`, the answers the page-speed
 * tests read.
 *
 *   PAGESPEED_API_KEY=… node be/test/fixtures/record-pagespeed-fixtures.ts
 *
 * Each target was chosen by what Google ANSWERED for it on 2026-10-11, not by what it was
 * expected to answer: a popular blog post had no field data of its own, and the site's
 * home page did. A target that stops answering as its file name says must be replaced.
 * `server-error.synthesized.json` and `errored-document.synthesized.json` stay synthesized:
 * Google cannot be made to fail on demand, and no page tried made Lighthouse answer
 * ERRORED_DOCUMENT_REQUEST. Project numbers in an answer are zeroed.
 *
 * A success answer is trimmed to the fields a reader of the measurement could touch —
 * the screenshots and every other audit make it 300–700 KB — and nothing else is changed.
 * The key goes in the `x-goog-api-key` header, as the app sends it, and a file that would
 * contain it is refused rather than written.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Node runs this file as an ES module (it has `import`s and no "type" field says
// otherwise), where `__dirname` does not exist; the script's own path does.
const FIXTURES = join(dirname(process.argv[1]), 'pagespeed');

const ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/** The file, the page, and which key to send: the real one, a made-up one, or none. */
const TARGETS: {
  file: string;
  url: string;
  key: 'real' | 'madeUp' | 'none';
}[] = [
  // The page's own Chrome data (`loadingExperience` without `origin_fallback`).
  { file: 'url-field.json', url: 'https://yoast.com/', key: 'real' },
  // The site's data under the page's name (`origin_fallback: true`).
  {
    file: 'origin-only.json',
    url: 'https://yoast.com/how-to-remove-www-from-your-url/',
    key: 'real',
  },
  // No Chrome data for the page or the site: Lighthouse's lab run only.
  {
    file: 'lab-only.json',
    url: 'https://octocat.github.io/Spoon-Knife/',
    key: 'real',
  },
  // A host that does not resolve: 400, FAILED_DOCUMENT_REQUEST.
  {
    file: 'failed-document.json',
    url: 'https://psi-fixture.invalid/',
    key: 'real',
  },
  // An empty error page: 400, NO_FCP — not ERRORED_DOCUMENT_REQUEST, which no page tried
  // produced (a 404 with content is measured like any page), so that one stays synthesized.
  { file: 'no-fcp.json', url: 'https://httpbin.org/status/500', key: 'real' },
  // A key Google does not know: 400, API_KEY_INVALID.
  { file: 'key-invalid.json', url: 'https://example.com/', key: 'madeUp' },
  // No key at all: a keyless request's quota is zero, so 429.
  { file: 'rate-limited.json', url: 'https://example.com/', key: 'none' },
];

const MADE_UP_KEY = 'AIzaSyD-not-a-real-key-000000000000000';

/** The audits `extractMeasurement` reads, and the lab metrics shown beside them. */
const KEPT_AUDITS = [
  'largest-contentful-paint',
  'cumulative-layout-shift',
  'first-contentful-paint',
  'total-blocking-time',
  'speed-index',
];

async function main(): Promise<void> {
  const key = process.env.PAGESPEED_API_KEY?.trim();
  if (!key) throw new Error('Set PAGESPEED_API_KEY to record.');
  for (const target of TARGETS) {
    const requestUrl = `${ENDPOINT}?url=${encodeURIComponent(target.url)}&strategy=mobile&category=performance`;
    const headers: Record<string, string> = { accept: 'application/json' };
    if (target.key === 'real') headers['x-goog-api-key'] = key;
    if (target.key === 'madeUp') headers['x-goog-api-key'] = MADE_UP_KEY;
    const response: Response = await fetch(requestUrl, { headers });
    const raw: string = await response.text();
    if (raw.includes(key))
      throw new Error(`${target.file}: the answer echoes the key`);
    const answer =
      response.status === 200
        ? JSON.stringify(trim(JSON.parse(raw)), null, 2)
        : raw;
    const body = answer.replace(
      /(projects\/|project_number:)\d+/g,
      (_, prefix: string) => `${prefix}000000000000`,
    );
    writeFileSync(join(FIXTURES, target.file), body);
    console.log(`${target.file}  ${response.status}  ${body.length} bytes`);
  }
}

/** The answer without the parts no reader of it here looks at. */
function trim(answer: Record<string, unknown>): Record<string, unknown> {
  const lighthouse = answer.lighthouseResult as
    Record<string, unknown> | undefined;
  if (!lighthouse) return answer;
  const audits = (lighthouse.audits ?? {}) as Record<string, unknown>;
  const categories = (lighthouse.categories ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const performance = categories.performance;
  return {
    ...answer,
    lighthouseResult: {
      requestedUrl: lighthouse.requestedUrl,
      finalUrl: lighthouse.finalUrl,
      finalDisplayedUrl: lighthouse.finalDisplayedUrl,
      lighthouseVersion: lighthouse.lighthouseVersion,
      fetchTime: lighthouse.fetchTime,
      runtimeError: lighthouse.runtimeError,
      runWarnings: lighthouse.runWarnings,
      audits: Object.fromEntries(
        KEPT_AUDITS.filter((id) => id in audits).map((id) => [id, audits[id]]),
      ),
      categories: performance
        ? {
            performance: {
              id: performance.id,
              title: performance.title,
              score: performance.score,
            },
          }
        : {},
    },
  };
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
