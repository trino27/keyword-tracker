/**
 * Whether a candidate has the SHAPE of a search query rather than of a clause.
 *
 * Threshold tuning cannot separate the two. Measured on the fixture catalogue, the
 * good long tail and the junk sit in the same band of relevance: `schema markup`
 * scored 0.30 and `every dollar` 0.26, `generative engine optimization` 0.23 and
 * `save money` 0.22. Raising the floor to 0.4 removed 34 junk terms and took
 * `schema markup`, `utm source`, `site speed` and `generative engine optimization`
 * with them. What the two groups do NOT share is grammar: a keyword is a noun
 * phrase, and the junk is a verb phrase with its subject cut off.
 *
 * A language is identified here by its verbs rather than parsed, because the module
 * has no part-of-speech tagger and a closed list of the commonest verbs covers what
 * the catalogue actually produced. The list belongs to the language profile, never to
 * this file: `set`, `test` and `plan` are English verbs and ordinary words elsewhere,
 * so a page in a language with no list falls through unchanged — the test is skipped,
 * not guessed at.
 */

/**
 * The phrase is a clause, not a query: it ENDS on a verb — "ways to increase",
 * "agencies charge", "want to know", "continue to work", "help you build".
 *
 * Only the LAST position is tested, and both other positions were tried and
 * rejected. A verb in the middle is what makes a real query: "how to remove www from
 * your url", "traffic from facebook is decreasing". A gerund in FIRST position
 * caught five more junk terms and cost more than they were worth — penalising
 * "operating system" promoted its own fragment `operating`, which is how a phrase
 * damped in place behaves whenever the fragment it leaves behind is still a
 * candidate.
 */
export function isClauseShaped(
  term: string,
  clauseVerbs: ReadonlySet<string>,
): boolean {
  // No list, no test. A page in a language this build has no profile for is left
  // alone rather than read through English grammar.
  if (clauseVerbs.size === 0) return false;
  const tokens = term.split(' ');
  if (tokens.length < 2) return false;
  return clauseVerbs.has(tokens[tokens.length - 1]);
}
