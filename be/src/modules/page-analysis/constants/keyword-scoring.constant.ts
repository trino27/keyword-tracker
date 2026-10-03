/**
 * Every tunable of keyword extraction (plan §10.4, D15). The golden fixture test pins
 * their combined effect on the recorded posts; change one and read what it moves.
 */

/**
 * Five, not three: the queries a page is actually written for run longer than three
 * words once a language puts particles between them — "южна африка без виза",
 * "самолетни билети до рим". At three the selection returned two overlapping windows
 * of the phrase instead of the phrase. At four it returned the phrase with its last
 * word missing, which is worse, because that is what the page is shown as being
 * about: "Email performance in Google Analytics" was stored as `email performance in
 * google`, "Technology report in Google Analytics" as `technology report in google`.
 */
export const MAX_NGRAM = 5;
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

/**
 * Presence weight per field; body is the only field scored by frequency, as
 * `body × ln(1 + occurrences)`.
 *
 * Title over body is what Google describes itself as reading, and the ordering here
 * stays. The body coefficient does not: at 1 a title mention was worth 9 points
 * before multipliers while the whole body could reach 3.7, so a word named once in a
 * heading always beat a word the article is actually made of. An 800-word news story
 * returned eight windows of its own title and not one of its subjects. At 2.5 a term
 * used ten times in the text weighs about as much as one in the title, which is the
 * balance the catalogue's own thin-content rule assumes.
 */
export const FIELD_WEIGHTS: Readonly<Record<TKeywordField, number>> = {
  title: 5,
  h1: 4,
  slug: 3,
  meta: 2,
  subheading: 2,
  firstParagraph: 1.5,
  body: 2.5,
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

/**
 * Index = token count. A single word is now damped rather than merely not preferred:
 * a bare word out of a title is the shape nearly every bad keyword took — `евро`,
 * `посока`, `national`, `ръчен`, `чекиран` — because an elliptical heading ("Ръчен и
 * чекиран") hands the adjective the title's whole weight while the phrase it belongs
 * to lives only in the text.
 */
export const NGRAM_FACTOR: readonly number[] = [0, 0.6, 1.15, 1.15, 1.0, 0.85];

/**
 * A shorter candidate gives way to a longer one containing it that scores this close.
 * At 0.8 the containment almost never fired: `national` (40.5) kept its place over
 * `iranian national` (30.4) by two points. The phrase says the same and more, so it
 * needs only to be in the same class, not to win outright.
 */
export const SUBSUME_RATIO = 0.5;

/**
 * Tokens a phrase may add and still swallow the term inside it. Subsumption was
 * written for "seo" giving way to "seo audit" — the phrase says the same and more.
 * A whole headline says something else: once five-word candidates existed,
 * `reasons to come to yoastcon` subsumed `yoastcon`, and the page about an event was
 * shown as being about coming to it. Past two tokens the longer string is no longer
 * the same subject said better, and the overlap rule decides between them on score.
 */
export const MAX_SUBSUME_GROWTH = 2;

/**
 * Two selected keywords may not share more than this share of the shorter one's
 * content tokens. Without it the sliding windows of one sentence take every slot:
 * `южна африка` + `африка без виза` + `пътуват до южна`, or eight windows of one
 * headline. Containment is already gone by then; this is the partial overlap that
 * subsumption cannot see.
 */
export const MAX_OVERLAP_RATIO = 0.5;

/**
 * The ceiling, for an article long enough to be about several things. Eight was a
 * budget no page in the catalogue could spend honestly: a 585-word post returned
 * `food and drinks`, `awesome line` and `venue and nijmegen` to fill it.
 */
export const MAX_KEYWORDS = 6;
/**
 * Slots a page gets before its length earns it more, and the prose it must carry per
 * further slot. A page states its subject in the first slot or two; everything after
 * that has to be paid for in words actually written. 267 words → 2, 850 → 4,
 * anything past ~1600 → the ceiling.
 */
export const KEYWORD_BUDGET_BASE = 2;
export const WORDS_PER_KEYWORD = 400;
/**
 * Kept only while scoring at least this share of the top keyword — and nothing is
 * added below it. A `MIN_KEYWORDS` backstop used to top every page up to five, which
 * on a page with one real subject meant four terms the scoring had just ruled out:
 * an author page returned `matt brittin` at 1.0 and four more at 0.12–0.14. Fewer
 * honest keywords beat five invented ones.
 */
export const FLOOR_RATIO = 0.2;

/**
 * Fields that NAME a subject rather than describe it. A description and a lede are
 * deliberate prose, and every four-word window of one scores as well as the sentence
 * that matters: "want to explain", "messages of businesses" and "oh the wonders" all
 * came from a meta description repeated as the opening paragraph. A candidate with
 * no anchor has to earn its place by recurring instead.
 *
 * A subheading is NOT one of them, though it keeps its weight. The h2s of a how-to
 * listicle are instructions, not subjects — "Add specific statistics to your
 * content", "Test your topics on AI platforms", "Next steps: start this week" — and
 * anchoring them meant a page said once in a heading what it never says again still
 * returned eight keywords, seven of them its own table of contents. Said twice in
 * the body a heading's phrase still passes; said once it is a section label.
 */
export const ANCHOR_FIELDS: ReadonlySet<TKeywordField> = new Set([
  'title',
  'h1',
  'slug',
]);

/** Occurrences that make an unanchored term the page's subject rather than a phrase in it. */
export const MIN_UNANCHORED_TF = 2;

/**
 * A title tail segment, or a declared keyword, that this share of the run's pages
 * also carries belongs to the site, not to the page. One page cannot tell a section
 * name from a subtitle, and a run can: it is the same evidence the IDF step uses,
 * read before scoring rather than after.
 */
export const RUN_BOILERPLATE_SHARE = 0.5;

/**
 * Selected keywords that may come from one run of text — one sentence, one heading.
 * A long headline has several non-overlapping windows and they are not several
 * subjects: "Dual UK-Iranian national released on bail over suspected plot against
 * US-run military base" produced `dual uk iranian national`, `run military base`,
 * `national released on bail` and `bail over suspected plot`, none of them sharing a
 * word with another, all of them the same sentence.
 */
export const MAX_KEYWORDS_PER_RUN = 2;

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
  // Folding contractions into their stem makes these bound a phrase for the first
  // time: "Let's play" normalized to `let s play`, which no list had to reject, and
  // now normalizes to `let play`, which one does.
  'let',
  'lets',
  // Prepositions and conjunctions the shipped list omits. Every one of them was
  // found ending or beginning a candidate on a live page: "suspected plot against",
  // "plot against us run", "against us run military" were three of one article's
  // eight keywords.
  'against',
  'among',
  'across',
  'although',
  'behind',
  'between',
  'beyond',
  'despite',
  'during',
  'even',
  'except',
  'however',
  'into',
  'onto',
  'over',
  'since',
  'through',
  'toward',
  'towards',
  'under',
  'unless',
  'until',
  'upon',
  'within',
  'without',
];
