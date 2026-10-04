/**
 * Everything keyword extraction knows about ONE language, in one place.
 *
 * The knowledge used to be spread: an English stop-word supplement sat among the
 * scoring hyperparameters, the phrase length a language supports sat there too as a
 * pair of constants, and the verbs that tell a clause from a query were compiled into
 * the step that reads them. None of that is tuning — it is linguistics, and mixing
 * the two meant a second language could not be added without editing files that have
 * nothing to do with it.
 *
 * A profile is data. Adding a language is adding one file and one registry entry; no
 * step, constant or test outside `languages/` changes. A language that needs more
 * than data — a stemmer, a different way of finding candidates — is a pipeline step
 * inserted with `insertAfter` or `replaceStep`, and this profile is what it reads.
 */
export interface ILanguageProfile {
  /** The `<html lang>` primary subtag (ISO 639-1) this profile answers for. */
  readonly code: string;

  /**
   * Words that may sit INSIDE a phrase but never bound one, normalized the way tokens
   * are. The shipped list for the language, plus whatever the profile adds.
   */
  readonly stopWords: ReadonlySet<string>;

  /**
   * Base-form verbs that make a phrase a clause when it ENDS on one — "ways to
   * increase", "agencies charge". Empty means the test does not run, which is the
   * honest answer for a language nobody has written the list for: a keyword is
   * damped by its shape or it is not, never by a guess.
   */
  readonly clauseVerbs: ReadonlySet<string>;

  /**
   * The longest phrase worth building in this language.
   *
   * Five, not three: the queries a page is written for run longer than three words
   * once a language puts particles between them — "южна африка без виза",
   * "самолетни билети до рим". At three the selection returned two overlapping
   * windows of the phrase instead of the phrase. At four it returned the phrase with
   * its last word missing, which is worse, because that is what the page is shown as
   * being about: "Email performance in Google Analytics" was stored as `email
   * performance in google`.
   */
  readonly maxNgram: number;
}

/**
 * What a page in a language this build has no profile for gets.
 *
 * No stop words, so no word is barred from bounding a phrase, and short phrases,
 * because without a stop-word list a 3-gram is mostly noise ("of the best"). This is
 * deliberately not a profile object: `profileFor` returns null and each reader says
 * what it does without one, so a missing language is visible at every site that cares
 * rather than silently answered by English's numbers.
 */
export const MAX_NGRAM_UNKNOWN_LANG = 2;

/** What a language WITH a stop-word list gets; see `maxNgram` above for why five. */
export const MAX_NGRAM_WITH_STOP_WORDS = 5;
