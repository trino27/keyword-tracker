import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'cheerio';
import { FIXTURES_ROOT } from '@infrastructure/remote-api/_testing/fixture-http-transport';
import { parseJsonLd } from './parse-json-ld';

const CONTROL_CHARACTERS = Array.from({ length: 0x20 }, (_, code) =>
  String.fromCharCode(code),
);

/** Every JSON-LD block of every recorded page, keyed by where it came from. */
function recordedBlocks(): { source: string; text: string }[] {
  const root = join(FIXTURES_ROOT, 'sites');
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.html'))
    .flatMap((file) => {
      const $ = load(readFileSync(join(root, file), 'utf8'));
      return $('script[type="application/ld+json"]')
        .toArray()
        .map((element, index) => ({
          source: `${file} #${index}`,
          text: $(element).text(),
        }));
    });
}

const strictly = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

describe('parseJsonLd', () => {
  describe('valid JSON', () => {
    it.each([
      ['an object', '{"@type": "Article", "headline": "A post"}'],
      ['an array', '[{"@type": "Article"}, {"@type": "Person"}]'],
      ['a @graph', '{"@graph": [{"@type": "BlogPosting"}]}'],
      ['escaped line breaks', '{"description": "one\\ntwo\\r\\nthree\\tfour"}'],
      ['a unicode escape', '{"name": "caf\\u00e9 \\u2028"}'],
      ['non-ASCII text', '{"name": "Ünïcödé — 日本語 🚀"}'],
    ])('reads %s exactly as JSON.parse does', (_, text) => {
      expect(parseJsonLd(text)).toEqual(JSON.parse(text));
    });

    // Pretty-printed JSON-LD is the norm; a line break between tokens is whitespace
    // JSON allows, and escaping it would break a block that was fine.
    it('leaves line breaks and tabs between tokens alone', () => {
      const text =
        '{\r\n\t"@type":\n  "Article",\n\n\t"headline": "A post"\n}\n';

      expect(parseJsonLd(text)).toEqual({
        '@type': 'Article',
        headline: 'A post',
      });
    });

    it('reads every JSON-LD block of every recorded page as JSON.parse does', () => {
      const blocks = recordedBlocks().filter(
        ({ text }) => strictly(text) !== undefined,
      );

      expect(blocks.length).toBeGreaterThan(40);
      for (const { source, text } of blocks)
        expect({ source, value: parseJsonLd(text) }).toEqual({
          source,
          value: JSON.parse(text),
        });
    });
  });

  describe('raw control characters inside strings', () => {
    it.each(
      CONTROL_CHARACTERS.map((character) => [
        character.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'),
        character,
      ]),
    )('keeps U+%s inside a value as the character it is', (_, character) => {
      const text = `{"description": "before${character}after"}`;

      expect(strictly(text)).toBeUndefined();
      expect(parseJsonLd(text)).toEqual({
        description: `before${character}after`,
      });
    });

    it('reads a multi-line description the way the page wrote it', () => {
      expect(
        parseJsonLd(
          '{\n  "@type": "Article",\n  "description": "First paragraph.\r\n\r\nSecond\tparagraph."\n}',
        ),
      ).toEqual({
        '@type': 'Article',
        description: 'First paragraph.\r\n\r\nSecond\tparagraph.',
      });
    });

    it('repairs a raw line break in a key as well as in a value', () => {
      expect(parseJsonLd('{"head\nline": "A post"}')).toEqual({
        'head\nline': 'A post',
      });
    });

    it('repairs every string of a block, not only the first', () => {
      expect(
        parseJsonLd(
          '{"@graph": [{"headline": "a\nb"}, {"name": ["c\nd", "e\tf"]}]}',
        ),
      ).toEqual({
        '@graph': [{ headline: 'a\nb' }, { name: ['c\nd', 'e\tf'] }],
      });
    });

    // A string ends at the first quote no backslash escapes; reading `\"` as the end
    // would escape the line break after the string instead of the one inside it.
    it('treats an escaped quote as part of the string', () => {
      expect(parseJsonLd('{"headline": "Say \\"hi\\"\nloudly"}')).toEqual({
        headline: 'Say "hi"\nloudly',
      });
    });

    // `\\` is an escaped backslash, so the quote after it closes the string; reading it
    // as an escaped quote would leave the parser inside a string for the rest of the
    // block and escape the whitespace between tokens.
    it('treats a quote after an escaped backslash as the end of the string', () => {
      expect(parseJsonLd('{"path": "C:\\\\",\n"note": "a\nb"}')).toEqual({
        path: 'C:\\',
        note: 'a\nb',
      });
    });

    it('keeps escaped and raw line breaks side by side', () => {
      expect(parseJsonLd('{"text": "escaped\\nraw\nend"}')).toEqual({
        text: 'escaped\nraw\nend',
      });
    });

    it('keeps characters outside the BMP intact while repairing', () => {
      expect(parseJsonLd('{"name": "🚀 launch\nday"}')).toEqual({
        name: '🚀 launch\nday',
      });
    });
  });

  describe('not JSON', () => {
    it.each([
      ['an empty block', ''],
      ['whitespace only', ' \n\t '],
      ['a missing brace', '{broken'],
      ['a trailing comma', '{"@type": "Article",}'],
      ['an unterminated string', '{"@type": "Article\n}'],
      ['single quotes', "{'@type': 'Article'}"],
      ['an HTML comment wrapper', '<!-- {"@type": "Article"} -->'],
      ['a raw line break in a broken block', '{"description": "a\nb",}'],
    ])('is nothing for %s', (_, text) => {
      expect(parseJsonLd(text)).toBeUndefined();
    });
  });
});
