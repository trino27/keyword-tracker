import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * External classic scripts in <head> with neither async nor defer: each stops the parser
 * until it is downloaded and run. Always applicable — a page without one has passed.
 */
export const RENDER_BLOCKING_SCRIPTS_CHECK = defineCheck(
  'RENDER_BLOCKING_SCRIPTS',
  ({ parsed }) =>
    parsed.renderBlockingScripts.length === 0
      ? PASS
      : fails({
          count: parsed.renderBlockingScripts.length,
          evidence: evidence(parsed.renderBlockingScripts),
        }),
);
