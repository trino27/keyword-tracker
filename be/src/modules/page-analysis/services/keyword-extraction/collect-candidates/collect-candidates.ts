import type { IParsedPage } from '../../../interfaces/parsed-page.interface';
import {
  MAX_TERM_LENGTH,
  REPEATED_RUN_MAX_TOKENS,
  REPEATED_RUN_MIN,
  TITLE_SEPARATORS,
  type TKeywordField,
} from '../../../constants/keyword-scoring.constant';
import {
  MAX_NGRAM_UNKNOWN_LANG,
  profileFor,
} from '../../../languages/language-profile';
import { normalizeText } from '../../text/normalize-text/normalize-text';
import { properNounsOf } from '../proper-nouns/proper-nouns';
import { isWeakToken, tokenize, type ITokenRun } from '../tokenize/tokenize';

export interface ICandidateStats {
  tokens: number;
  /** Every field the candidate appears in, body included. */
  fields: Set<TKeywordField>;
  /** Occurrences in the main content. */
  bodyTf: number;
  /** Equals, or is part of, a keyword the page declares itself. */
  declared: boolean;
  /** A single word the page's prose writes as a name; see `properNounsOf`. */
  properNoun: boolean;
  /**
   * Ids of the runs of text this term was read from — one per DISTINCT sentence or
   * heading it occurs in. Selection uses them to tell several subjects from several
   * windows of one sentence.
   */
  runs: Set<number>;
}

export interface ICandidateSource {
  url: string;
  parsed: IParsedPage;
  siteKey: string;
  /**
   * Normalized title tail segments the RUN showed to be the site's rather than the
   * page's — the brand, and the section a CMS appends after it. Empty for a single
   * page, which then relies on the brand name alone.
   */
  titleChrome?: ReadonlySet<string>;
  /**
   * Normalized declared keywords most of the run also declares. A news CMS emits its
   * rubric there ("International", "Region National"), and the declared bonus would
   * reward the taxonomy instead of the topic.
   */
  taxonomyKeywords?: ReadonlySet<string>;
}

/** A title cut at its separators: "A - National | Brand" → ["A", "National", "Brand"]. */
export function titleSegments(title: string): string[] {
  let segments = [title];
  for (const separator of TITLE_SEPARATORS) {
    segments = segments.flatMap((segment) => segment.split(separator));
  }
  return segments.map((segment) => segment.trim()).filter(Boolean);
}

/**
 * "How to X | Yoast" → "How to X", and "… - National | Globalnews.ca" → "…": tail
 * segments go while they name the site — the site key's first label, `og:site_name`,
 * or a segment the rest of the run also ends with, which is how a section name is
 * told from a title that happens to have a dash in it. Stripping only ONE segment
 * left "National" the top-scoring term of every Global News article.
 */
/** Words that name the site, for recognising a title's tail. */
function brandWords(siteKey: string, siteName: string | undefined): string[] {
  return [siteKey.split('.')[0], siteName]
    .filter((brand): brand is string => Boolean(brand))
    .flatMap((brand) => normalizeText(brand).split(' '))
    .filter(Boolean);
}

/**
 * The one word that is the site's own, from the site key alone. `og:site_name` is
 * not used here: "Global News" would make `news` unable to end a phrase on a news
 * site, and a site's description of itself is not reliably its distinctive word.
 */
export function siteWord(siteKey: string): string {
  return normalizeText(siteKey.split('.')[0]);
}

export function stripTitleChrome(
  title: string,
  siteKey: string,
  siteName: string | undefined,
  titleChrome: ReadonlySet<string> = new Set(),
): string {
  const brands = brandWords(siteKey, siteName);
  const segments = titleSegments(title);
  // Never the whole title: a page whose title IS its section name keeps it.
  while (segments.length > 1) {
    const tail = ` ${normalizeText(segments[segments.length - 1])} `;
    const isChrome =
      brands.some((brand) => tail.includes(` ${brand} `)) ||
      titleChrome.has(tail.trim());
    if (!isChrome) break;
    segments.pop();
  }
  // Rejoined with a separator, so no phrase is stitched across what was one.
  return segments.join(' - ');
}

/**
 * The clause boundaries inside a title — a colon, a question or exclamation mark, a
 * plus, or a separator `stripTitleChrome` left behind. A title is not one phrase:
 * "Local SEO ranking factors: Your complete guide" is a subject and a promise, and
 * "Facebook Audience Overlap Explained + Ways to Avoid It" is two claims the plus
 * once glued into `overlap explained ways to avoid`, a phrase the page never says.
 */
const TITLE_CLAUSE = /[:?!+]+|\s[-–—|·•]\s/u;

/** A title cut into its clauses, in the order written. */
export function titleClauses(title: string): string[] {
  return title
    .split(TITLE_CLAUSE)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

/**
 * The clause that NAMES the page, and the clauses that merely describe it.
 *
 * Position alone was tried first and is wrong often enough to matter. It holds for
 * "Local SEO ranking factors: Your complete guide", and it inverts for "Optimizing a
 * single page: One page website SEO", where the subject is second and demoting it
 * filed the post under `single page`. The slug settles it: an author writes the URL
 * out of the subject, so the clause whose words the slug repeats is the subject —
 * here `one-page-website-seo`. With no slug, or no clause it shares a word with, the
 * first clause is still the best guess.
 */
export function namedClause(
  title: string,
  slug: string,
): { head: string; tail: string[] } {
  const clauses = titleClauses(title);
  if (clauses.length === 0) return { head: '', tail: [] };
  const slugTokens = new Set(normalizeText(slug).split(' ').filter(Boolean));
  let best = 0;
  let bestShare = 0;
  clauses.forEach((clause, index) => {
    const tokens = normalizeText(clause).split(' ').filter(Boolean);
    if (tokens.length === 0) return;
    // The SHARE of the clause that the slug repeats, not the count. Counting matches
    // outright hands it to whichever clause is longer, and a slug written out of the
    // whole title then names the wrong one: "Facebook traffic: What's the current
    // status?" scored 2 for its subject and 3 for its question, and the post was
    // filed under `current status`.
    const share =
      tokens.filter((token) => slugTokens.has(token)).length / tokens.length;
    // Strictly greater, so a tie leaves the clause the author wrote first in front.
    if (share > bestShare) {
      bestShare = share;
      best = index;
    }
  });
  return {
    head: clauses[best],
    tail: clauses.filter((_, index) => index !== best),
  };
}

const VOWEL = /[aeiouyàâäåæéèêëíìîïóòôöøœúùûüýÿаеёиоуыэюяіїєўъ]/i;

/**
 * A slug token that is not a word: part of an opaque id, a hash, a base64 fragment.
 * Letters mixed with digits, or no vowel at all.
 */
function looksLikeId(token: string): boolean {
  return (/\p{L}/u.test(token) && /\p{N}/u.test(token)) || !VOWEL.test(token);
}

/**
 * The URL's last path segment as words, or '' when it is an identifier.
 *
 * Two things went wrong here. A percent-encoded path — every non-ASCII URL — reached
 * the candidates as its hex: `полети-до-рим` scored `d0 bf` and `bf d0`, while the
 * real words never arrived and the page's own topic lost the slug's weight entirely.
 * And an opaque id (`BDgx_QEdO0G1NNL-VyGD1A`) says nothing at all, yet at a slug's
 * weight its fragments outscore real body terms. A slug is either words or an
 * identifier; a mixed verdict is the identifier's.
 */
export function slugOf(url: string): string {
  let segment: string;
  try {
    const segments = new URL(url).pathname.split('/').filter(Boolean);
    segment = (segments.at(-1) ?? '').replace(/\.[a-z0-9]+$/i, '');
  } catch {
    return '';
  }
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    // A stray '%' is not an encoding; the segment as written is the better guess.
  }
  const tokens = decoded.replace(/[-_]+/g, ' ').split(' ').filter(Boolean);
  const noise = tokens.filter(looksLikeId).length;
  return noise * 2 > tokens.length ? '' : tokens.join(' ');
}

/**
 * Every 1..n-gram of a run that neither starts nor ends with a non-bounding token —
 * a stop word, a weak token, or the site's own name. A weak token INSIDE is what
 * makes `евро в посока` and `багаж с wizz air` expressible at all; the brand inside
 * is what keeps "ecommerce dashboard by yoast" from becoming "ecommerce dashboard"'s
 * better-scoring twin.
 */
function* gramsOf(
  run: ITokenRun,
  nonBounding: ReadonlySet<string>,
  maxNgram: number,
): Generator<{ term: string; tokens: number }> {
  const { tokens, glued } = run;
  const bounds = (token: string) =>
    !isWeakToken(token) && !nonBounding.has(token);
  // A token that cannot bound a phrase on its own still may when it is half of a
  // written word: `2` ends "http/2" and `out` ends "fan-out", and the phrase stops
  // inside the compound rather than on a loose stop word.
  const opens = (at: number) => bounds(tokens[at]) || glued[at + 1] === true;
  const closes = (at: number) => bounds(tokens[at]) || glued[at] === true;
  for (let start = 0; start < tokens.length; start += 1) {
    if (!opens(start)) continue;
    for (let n = 1; n <= maxNgram && start + n <= tokens.length; n += 1) {
      if (!closes(start + n - 1)) continue;
      const term = tokens.slice(start, start + n).join(' ');
      if (term.length <= MAX_TERM_LENGTH) yield { term, tokens: n };
    }
  }
}

/**
 * Short runs of body text the page repeats verbatim — `quick action`, `pro tip`,
 * `read more`. Collected before scoring and then skipped, because frequency is the
 * only evidence the body gives and a template defeats it.
 */
export function repeatedBodyRuns(blocks: string[]): ReadonlySet<string> {
  const counts = new Map<string, number>();
  for (const block of blocks) {
    for (const { tokens } of tokenize(block)) {
      if (tokens.length > REPEATED_RUN_MAX_TOKENS) continue;
      const key = tokens.join(' ');
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return new Set(
    [...counts]
      .filter(([, seen]) => seen >= REPEATED_RUN_MIN)
      .map(([key]) => key),
  );
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
  const profile = profileFor(parsed.lang);
  const maxNgram = profile ? profile.maxNgram : MAX_NGRAM_UNKNOWN_LANG;
  const nonBounding = new Set([
    ...(profile?.stopWords ?? []),
    siteWord(source.siteKey),
  ]);
  const taxonomy = source.taxonomyKeywords ?? new Set<string>();
  const declared = [...parsed.jsonLd.keywords, ...parsed.articleTags]
    .map((keyword) => normalizeText(keyword))
    .filter((keyword) => keyword.length > 0 && !taxonomy.has(keyword))
    .map((keyword) => ` ${keyword} `);

  const mainH1 = parsed.headings.find((heading) => heading.level === 1)?.text;
  const slug = slugOf(source.url);
  const { head: h1Head, tail: h1Tail } = namedClause(
    mainH1 ?? parsed.h1s[0] ?? '',
    slug,
  );
  const { head: titleHead, tail: titleTail } = namedClause(
    parsed.title
      ? stripTitleChrome(
          parsed.title,
          source.siteKey,
          parsed.openGraph['og:site_name'],
          source.titleChrome,
        )
      : '',
    slug,
  );
  const fields: [TKeywordField, string[]][] = [
    ['title', titleHead ? [titleHead] : []],
    // The h1 is the title written again on nearly every blog theme, so a tail demoted
    // in one and left whole in the other is not demoted at all: `complete guide` kept
    // the h1's weight of 4 and its anchor, and nothing moved.
    ['h1', h1Head ? [h1Head] : []],
    ['titleTail', [...titleTail, ...h1Tail]],
    ['slug', [slug]],
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

  const repeated = repeatedBodyRuns(parsed.blocks);
  const properNouns = properNounsOf(parsed.blocks);
  const candidates = new Map<string, ICandidateStats>();
  // Keyed by the run's own words, not by a counter. A post's title, its h1 and its
  // slug are usually the same sentence written three times, and counting them as
  // three let one headline spend a list that allows two keywords per sentence:
  // canadiangeographic.ca returned `canadian astronaut joshua kutryk launches` AND
  // `kutryk launches on long term`, both at relevance 1, for one piece of news.
  const runIds = new Map<string, number>();
  const runIdOf = (run: string[]) => {
    const key = run.join(' ');
    const existing = runIds.get(key);
    if (existing !== undefined) return existing;
    runIds.set(key, runIds.size);
    return runIds.size - 1;
  };
  for (const [field, texts] of fields) {
    for (const text of texts) {
      for (const run of tokenize(text)) {
        if (field === 'body' && repeated.has(run.tokens.join(' '))) continue;
        const runId = runIdOf(run.tokens);
        for (const { term, tokens } of gramsOf(run, nonBounding, maxNgram)) {
          let stats = candidates.get(term);
          if (!stats) {
            stats = {
              tokens,
              fields: new Set(),
              bodyTf: 0,
              declared: declared.some((keyword) =>
                keyword.includes(` ${term} `),
              ),
              properNoun: tokens === 1 && properNouns.has(term),
              runs: new Set(),
            };
            candidates.set(term, stats);
          }
          stats.fields.add(field);
          stats.runs.add(runId);
          if (field === 'body') stats.bodyTf += 1;
        }
      }
    }
  }
  return candidates;
}
