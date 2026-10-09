/**
 * The value of one `<script type="application/ld+json">` block, or `undefined` when it is
 * not JSON at all.
 *
 * Strict JSON forbids a raw control character — a line break, a tab — inside a string.
 * Google's parser and every structured-data validator accept one, and CMSes emit them:
 * semrush pastes a two-line description into its Article node as is. A strict parse
 * would throw that whole block away and report a page with article markup as a page
 * without it, so a block that fails is retried once with those characters escaped.
 *
 * Only that one defect is forgiven. Anything else that is not JSON — a missing brace, a
 * trailing comma, an unterminated string — is still nothing, as it was before.
 */
export function parseJsonLd(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Retried below; most blocks never get here.
  }
  try {
    return JSON.parse(escapeControlCharactersInStrings(text));
  } catch {
    return undefined;
  }
}

const SHORT_ESCAPES: Readonly<Record<string, string>> = {
  '\b': '\\b',
  '\t': '\\t',
  '\n': '\\n',
  '\f': '\\f',
  '\r': '\\r',
};

/**
 * Escapes U+0000–U+001F inside string literals and leaves everything else untouched:
 * between tokens a line break is whitespace JSON already allows, and escaping it there
 * would turn valid JSON into invalid JSON.
 */
function escapeControlCharactersInStrings(text: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (const character of text) {
    if (!inString) {
      if (character === '"') inString = true;
      out += character;
      continue;
    }
    if (escaped) {
      escaped = false;
      out += character;
      continue;
    }
    if (character === '\\') escaped = true;
    else if (character === '"') inString = false;
    else if (character < ' ') {
      out +=
        SHORT_ESCAPES[character] ??
        `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
      continue;
    }
    out += character;
  }
  return out;
}
