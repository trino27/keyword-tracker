/**
 * Every tunable of keyword extraction (plan §10.4, D15). The golden fixture test pins
 * their combined effect on the recorded posts; change one and read what it moves.
 */

export const MAX_NGRAM = 3;
/** Without a stop-word list, 3-grams are mostly noise ("of the best"). */
export const MAX_NGRAM_UNKNOWN_LANG = 2;
export const MIN_TOKEN_LENGTH = 2;
/** A stored keyword term is at most this long (the column width). */
export const MAX_TERM_LENGTH = 200;

export const KEYWORD_FIELDS = [
  'title',
  'h1',
  'slug',
  'meta',
  'subheading',
  'firstParagraph',
  'body',
] as const;
export type TKeywordField = (typeof KEYWORD_FIELDS)[number];

/** Presence weight per field; body is the only field scored by frequency. */
export const FIELD_WEIGHTS: Readonly<Record<TKeywordField, number>> = {
  title: 5,
  h1: 4,
  slug: 3,
  meta: 2,
  subheading: 2,
  firstParagraph: 1.5,
  body: 1,
};

/** Fields an author writes on purpose; appearing in several of them is a signal. */
export const STRONG_FIELDS: ReadonlySet<TKeywordField> = new Set([
  'title',
  'h1',
  'slug',
  'meta',
  'subheading',
]);
export const MULTI_FIELD_BONUS = 0.25;

/** The page's own declared keywords (JSON-LD `keywords`, `article:tag`). */
export const METADATA_BONUS = 1.15;

/** Index = token count: phrases are preferred over single words, a little. */
export const NGRAM_FACTOR: readonly number[] = [0, 1.0, 1.15, 1.1];

/** A shorter candidate gives way to a longer one containing it that scores this close. */
export const SUBSUME_RATIO = 0.8;

export const MAX_KEYWORDS = 8;
export const MIN_KEYWORDS = 5;
/** Kept only while scoring at least this share of the top keyword. */
export const FLOOR_RATIO = 0.25;

/** Title separators before a brand suffix: "How to X | Brand". */
export const TITLE_SEPARATORS = [
  ' | ',
  ' - ',
  ' – ',
  ' — ',
  ' · ',
  ' • ',
] as const;

/**
 * Words the `stopword` English list lacks but web prose is full of. Applied only to
 * English pages; other languages use their list as shipped.
 */
export const EXTRA_ENGLISH_STOP_WORDS: readonly string[] = [
  'why',
  'will',
  'its',
  'does',
  'just',
  'may',
  'might',
  'must',
  'here',
  'there',
  'which',
  'who',
  'whom',
  'whose',
  'when',
  'where',
  'while',
  'than',
  'then',
  'them',
  'they',
  'their',
  'our',
  'ours',
  'we',
  'us',
  'my',
  'me',
  're',
  've',
  'll',
  'don',
  'doesn',
  'didn',
  'isn',
  'aren',
  'wasn',
  'can',
  'cannot',
  'could',
  'would',
  'should',
  'yet',
  'etc',
];
