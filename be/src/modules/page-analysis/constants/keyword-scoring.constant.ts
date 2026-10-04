/**
 * Every tunable of keyword extraction (plan §10.4, D15). The golden fixture test pins
 * their combined effect on the recorded posts; change one and read what it moves.
 */

/**
 * Language is NOT tuned here. Stop words, the verbs that tell a clause from a query
 * and the longest phrase a language supports live in `../languages/`, one profile per
 * language, because they are linguistics rather than hyperparameters: a second
 * language is a file added there and nothing changed here. What stays in this file
 * applies to every language the crawler meets.
 */
export const MIN_TOKEN_LENGTH = 2;
/** A stored keyword term is at most this long (the column width). */
export const MAX_TERM_LENGTH = 200;

/**
 * A title's SECOND clause and beyond — what follows the colon, the question mark or
 * the plus in "Local SEO ranking factors: Your complete guide".
 *
 * The first clause names the page; the rest promises a format. At the title's own
 * weight of 5 that promise outscores the article, and the catalogue filled up with
 * `complete guide`, `statistics you need to know`, `tools use cases for marketers`
 * and `current status`. The weight stays positive because a tail sometimes carries
 * the subject ("Gutenberg: the new editor in WordPress 5.0") — it is demoted, not
 * discarded, and it stops ANCHORING, so a phrase said once in a tail and never again
 * is no longer treated as a declared subject.
 */
export const TITLE_TAIL_WEIGHT = 2;

export const KEYWORD_FIELDS = [
  'title',
  'titleTail',
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
  titleTail: TITLE_TAIL_WEIGHT,
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
  'titleTail',
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
 *
 * The single-word entry is spent where that weight comes from — see `ngramFactor`,
 * which damps a bare word the title, h1 or slug names and leaves one the prose
 * earned alone.
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
 * The ratio for a longer phrase that EXTENDS the shorter one at one end rather than
 * wrapping around it — "data science" inside "data science for seo".
 *
 * Lowering SUBSUME_RATIO outright was measured and rejected: at 0.35 it did rescue
 * `data science for seo` and `secondary dimensions in google analytics`, and in the
 * same run it let `algorithm changes seo becomes crucial` swallow `facebook
 * algorithm` and a sentence became the page's keyword. The difference is where the
 * added words sit. A phrase that continues the term — `… for seo`, `… in google
 * analytics` — is the same subject said more precisely. A phrase that contains the
 * term in its middle is a sentence the term happens to appear in, and it still has
 * to win on score.
 */
export const SUBSUME_EXTENSION_RATIO = 0.4;

/**
 * What a candidate shaped like a clause rather than a query keeps of its score; see
 * `isClauseShaped`. 1 disables the test, 0 removes the candidate outright.
 */
export const CLAUSE_SHAPE_FACTOR = 0;

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
 * How much of the corpus penalty a term still pays when the page names it in its own
 * title, h1 or slug. The penalty is there to strip the site's vocabulary from pages
 * that merely mention it, and a term in the title is not mentioned — it is declared.
 * Yoast has three posts about Facebook traffic, enough that `facebook traffic` paid a
 * third of its score and "Facebook traffic: What's the current status?" was filed
 * under `current status`. A section a site writes about repeatedly is still what its
 * posts are about.
 */
export const ANCHORED_IDF_SHARE = 0.5;
/**
 * …but only while the term is one section's and not the whole site's. Half of Yoast's
 * posts put "Google Analytics" in the title, and forgiving an anchored term outright
 * made `google analytics` the keyword of the post about dashboards and the post about
 * assisted conversions alike; on Semrush the same relief handed a 3,300-word guide to
 * `ai search` and left no room under the floor for `schema markup` or `generative
 * engine optimization`. Past this share of the run a title says where on the site the
 * page lives rather than what it says, and the penalty applies in full.
 */
export const ANCHORED_IDF_MAX_SHARE = 0.15;

/**
 * A title tail segment, or a declared keyword, that this share of the run's pages
 * also carries belongs to the site, not to the page. One page cannot tell a section
 * name from a subtitle, and a run can: it is the same evidence the IDF step uses,
 * read before scoring rather than after.
 */
export const RUN_BOILERPLATE_SHARE = 0.5;

/**
 * A short block of text the page repeats verbatim this many times is its own
 * furniture, not its prose: a recurring callout label, a CTA, a caption. The AI
 * search post prints `Quick action:` before twenty of its paragraphs, and twenty
 * body occurrences of a two-word label outscored almost everything the article is
 * about. The run-level boilerplate pass cannot see it — it is one page's habit, not
 * the site's — and the IDF step sees it on one page and rewards it.
 *
 * Only a SHORT run counts: a sentence repeated three times is emphasis, a two-word
 * fragment repeated three times is a template.
 */
export const REPEATED_RUN_MIN = 3;
export const REPEATED_RUN_MAX_TOKENS = 4;

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
