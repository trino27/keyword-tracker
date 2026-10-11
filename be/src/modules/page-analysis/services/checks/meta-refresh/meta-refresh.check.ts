import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

/**
 * The address a refresh moves to, read as HTML's "shared declarative refresh steps" read
 * it: a time (digits and dots), then optionally `;` or `,`, then optionally `url=`, then
 * the address, its quotes stripped. Null when the content names no address — `content="30"`
 * re-requests the same page, a refresh and not a move — or does not start with a time,
 * which a browser ignores altogether.
 *
 * `url=` is optional and the comma counts: `0; https://b.example/` and `0,url=/x` move the
 * reader as surely as `0; url=/x`.
 */
export function refreshTargetOf(content: string): string | null {
  const timed = /^\s*(\d*)(\.[\d.]*)?/.exec(content);
  if (!timed || (timed[1] === '' && timed[2] === undefined)) return null;
  let rest = content.slice(timed[0].length);
  if (rest !== '' && !/^[\s;,]/.test(rest)) return null;
  rest = rest.replace(/^\s*[;,]?\s*/, '');
  rest = rest.replace(/^url\s*=\s*/i, '');
  const quote = /^['"]/.exec(rest)?.[0];
  if (quote) {
    rest = rest.slice(1);
    const end = rest.indexOf(quote);
    if (end !== -1) rest = rest.slice(0, end);
  }
  const target = rest.trim();
  return target === '' ? null : target;
}

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
  const target = refreshTargetOf(parsed.metaRefresh);
  // `content` as written, because the screen quotes the tag back to the author, and `to`
  // beside it so a reader of the API does not have to parse the attribute again.
  return target
    ? fails({
        content: parsed.metaRefresh,
        to: target,
        evidence: evidence([
          `<meta http-equiv="refresh" content="${attribute(parsed.metaRefresh)}">`,
        ]),
      })
    : PASS;
});
