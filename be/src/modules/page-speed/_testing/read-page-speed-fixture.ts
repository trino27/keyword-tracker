import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';

/**
 * A recorded (or, where named `.synthesized.json`, documentation-built) PageSpeed answer,
 * parsed fresh on every call so a test may mutate it.
 */
export function readPageSpeedFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(join(FIXTURES_ROOT, 'pagespeed', name), 'utf8'),
  ) as unknown;
}

/** The same file as raw bytes, as the transport would hand them over. */
export function pageSpeedFixtureBody(name: string): Buffer {
  return readFileSync(join(FIXTURES_ROOT, 'pagespeed', name));
}
