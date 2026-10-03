import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import {
  MAX_NGRAM,
  MAX_NGRAM_UNKNOWN_LANG,
  MAX_TERM_LENGTH,
  TITLE_SEPARATORS,
  type TKeywordField,
} from '../../../constants/keyword-scoring.constant';
import { normalizeText } from '../../text/normalize-text/normalize-text';
import { stopWordsFor } from '../stop-words/stop-words';
import { tokenize } from '../tokenize/tokenize';

export interface ICandidateStats {
  tokens: number;
  /** Every field the candidate appears in, body included. */
  fields: Set<TKeywordField>;
  /** Occurrences in the main content. */
  bodyTf: number;
  /** Equals, or is part of, a keyword the page declares itself. */
  declared: boolean;
}

export interface ICandidateSource {
  url: string;
  parsed: IParsedPage;
  siteKey: string;
}

/**
 * "How to X | Yoast" → "How to X": the last segment goes when it names the site — the
 * site key's first label or og:site_name. Brand words otherwise top every title.
 */
export function stripBrandSuffix(
  title: string,
  siteKey: string,
  siteName: string | undefined,
): string {
  const brands = [siteKey.split('.')[0], siteName]
    .filter((brand): brand is string => Boolean(brand))
    .map(normalizeText)
    .filter(Boolean);
  let cut = -1;
  let separatorLength = 0;
  for (const separator of TITLE_SEPARATORS) {
    const at = title.lastIndexOf(separator);
    if (at > cut) {
      cut = at;
      separatorLength = separator.length;
    }
  }
  if (cut <= 0) return title;
  const suffix = ` ${normalizeText(title.slice(cut + separatorLength))} `;
  return brands.some((brand) => suffix.includes(` ${brand} `))
    ? title.slice(0, cut)
    : title;
}

function slugOf(url: string): string {
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    return (segments.at(-1) ?? '').replace(/\.[a-z0-9]+$/i, '');
  } catch {
    return '';
  }
}

/** Every 1..n-gram of a run that neither starts nor ends with a stop word. */
function* gramsOf(
  run: string[],
  stopWords: ReadonlySet<string> | null,
  maxNgram: number,
): Generator<{ term: string; tokens: number }> {
  for (let start = 0; start < run.length; start += 1) {
    if (stopWords?.has(run[start])) continue;
    for (let n = 1; n <= maxNgram && start + n <= run.length; n += 1) {
      if (stopWords?.has(run[start + n - 1])) continue;
      const term = run.slice(start, start + n).join(' ');
      if (term.length <= MAX_TERM_LENGTH) yield { term, tokens: n };
    }
  }
}

/**
 * The keyword candidates of one page, with the fields each appears in (§10.4 steps
 * 2–5). Each text is tokenized on its own, so no phrase spans a heading and the next
 * paragraph.
 */
export function collectCandidates(
  source: ICandidateSource,
): Map<string, ICandidateStats> {
  const { parsed } = source;
  const stopWords = stopWordsFor(parsed.lang);
  const maxNgram = stopWords ? MAX_NGRAM : MAX_NGRAM_UNKNOWN_LANG;
  const declared = [...parsed.jsonLd.keywords, ...parsed.articleTags]
    .map((keyword) => ` ${normalizeText(keyword)} `)
    .filter((keyword) => keyword.trim().length > 0);

  const mainH1 = parsed.headings.find((heading) => heading.level === 1)?.text;
  const fields: [TKeywordField, string[]][] = [
    [
      'title',
      parsed.title
        ? [
            stripBrandSuffix(
              parsed.title,
              source.siteKey,
              parsed.openGraph['og:site_name'],
            ),
          ]
        : [],
    ],
    ['h1', [mainH1 ?? parsed.h1s[0] ?? ''].filter(Boolean)],
    ['slug', [slugOf(source.url).replace(/[-_]+/g, ' ')]],
    ['meta', parsed.metaDescription ? [parsed.metaDescription] : []],
    [
      'subheading',
      parsed.headings
        .filter((heading) => heading.level === 2 || heading.level === 3)
        .map((heading) => heading.text),
    ],
    ['firstParagraph', parsed.firstParagraph ? [parsed.firstParagraph] : []],
    ['body', parsed.blocks],
  ];

  const candidates = new Map<string, ICandidateStats>();
  for (const [field, texts] of fields) {
    for (const text of texts) {
      for (const run of tokenize(text)) {
        for (const { term, tokens } of gramsOf(run, stopWords, maxNgram)) {
          let stats = candidates.get(term);
          if (!stats) {
            stats = {
              tokens,
              fields: new Set(),
              bodyTf: 0,
              declared: declared.some((keyword) =>
                keyword.includes(` ${term} `),
              ),
            };
            candidates.set(term, stats);
          }
          stats.fields.add(field);
          if (field === 'body') stats.bodyTf += 1;
        }
      }
    }
  }
  return candidates;
}
