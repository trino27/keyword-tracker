import { defineCheck, fails, PASS } from '../check.interface';

/**
 * `content="5; url=/elsewhere"` — the delay, then the target. The `url=` part is what
 * makes it a redirect; `content="30"` alone re-requests the same page, which is a
 * refresh and not a move.
 */
const TARGET = /(^|;)\s*url\s*=\s*(.+)$/i;

/**
 * A meta refresh that moves the reader somewhere else. Google asks for a server-side 301:
 * the refresh is slower, and it states the move less clearly to anything that is not a
 * browser.
 *
 * Always applicable: a page without the tag has passed, not escaped — there is no
 * condition under which the question cannot be asked.
 */
export const META_REFRESH_CHECK = defineCheck('META_REFRESH', ({ parsed }) => {
  if (parsed.metaRefresh === null) return PASS;
  const target = TARGET.exec(parsed.metaRefresh)?.[2]?.trim();
  // `content` as written, because the screen quotes the tag back to the author, and `to`
  // beside it so a reader of the API does not have to parse the attribute again.
  return target
    ? fails({
        content: parsed.metaRefresh,
        to: target.replace(/^['"]|['"]$/g, ''),
      })
    : PASS;
});
