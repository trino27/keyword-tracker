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
 * English is identified here by its verbs rather than parsed, because the module has
 * no part-of-speech tagger and a closed list of the commonest verbs covers what the
 * catalogue actually produced. Pages in a language with no list fall through
 * unchanged — the test is skipped, not guessed at.
 */

/**
 * Base-form verbs common enough in web prose to end a clause. Every one of them was
 * found ending a junk candidate on a live page, or is a near neighbour of one.
 */
const VERBS = new Set([
  'add',
  'ask',
  'avoid',
  'become',
  'begin',
  'believe',
  'break',
  'bring',
  'build',
  'buy',
  'call',
  'change',
  'charge',
  'check',
  'choose',
  'click',
  'come',
  'continue',
  'create',
  'decide',
  'do',
  'drive',
  'earn',
  'enter',
  'expect',
  'explain',
  'fail',
  'fill',
  'find',
  'fix',
  'focus',
  'follow',
  'get',
  'give',
  'go',
  'grow',
  'happen',
  'help',
  'hire',
  'hold',
  'improve',
  'include',
  'increase',
  'invest',
  'keep',
  'know',
  'learn',
  'leave',
  'like',
  'live',
  'look',
  'lose',
  'love',
  'make',
  'manage',
  'mean',
  'measure',
  'meet',
  'move',
  'need',
  'offer',
  'open',
  'pay',
  'pick',
  'place',
  'plan',
  'play',
  'put',
  'reach',
  'read',
  'remember',
  'remove',
  'rank',
  'run',
  'save',
  'say',
  'see',
  'sell',
  'send',
  'serve',
  'set',
  'share',
  'show',
  'sign',
  'solve',
  'spend',
  'start',
  'stay',
  'stop',
  'take',
  'talk',
  'tell',
  'test',
  'think',
  'try',
  'turn',
  'understand',
  'update',
  'use',
  'verify',
  'wait',
  'walk',
  'want',
  'watch',
  'win',
  'work',
  'write',
]);

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
export function isClauseShaped(term: string): boolean {
  const tokens = term.split(' ');
  if (tokens.length < 2) return false;
  return VERBS.has(tokens[tokens.length - 1]);
}
