import { ENGLISH } from '../../../languages/english/english';
import { isClauseShaped } from './phrase-shape';

const EN = ENGLISH.clauseVerbs;

describe('isClauseShaped', () => {
  it.each([
    'ways to increase',
    'want to know',
    'need to know',
    'agencies charge',
    'continue to work',
    'help you build',
    'statistics you need to know',
    'measure results and improve',
  ])('rejects %p, which ends on a verb', (term) => {
    expect(isClauseShaped(term, EN)).toBe(true);
  });

  it.each([
    'schema markup',
    'generative engine optimization',
    'data science for seo',
    'reply to google reviews',
    'find youtube influencers',
    'global market size for ai',
    'traffic from facebook is decreasing',
    'remove www from your url',
  ])('keeps %p, where any verb is not at the end', (term) => {
    expect(isClauseShaped(term, EN)).toBe(false);
  });

  it.each(['save money', 'break something', 'create and use dashboards'])(
    'does NOT catch %p: the verb opens the phrase, and only the end is read',
    (term) => {
      // The limit of the rule, recorded rather than hidden. Reading the first
      // position too was measured: it caught five more terms like these and
      // promoted `operating` over `operating system`, which cost more.
      expect(isClauseShaped(term, EN)).toBe(false);
    },
  );

  it('does nothing at all for a language with no verb list', () => {
    // A German or Bulgarian page reaches this with an empty set, and `agencies
    // charge` is left alone rather than read through English grammar.
    expect(isClauseShaped('agencies charge', new Set())).toBe(false);
    expect(isClauseShaped('ways to increase', new Set())).toBe(false);
  });

  it('never rejects a single word, which has no shape to read', () => {
    // `gutenberg`, `yoastcon` and `mckinsey` all reach this; so does a bare verb,
    // and the single-word damping in `ngramFactor` is what answers that one.
    expect(isClauseShaped('update', EN)).toBe(false);
    expect(isClauseShaped('gutenberg', EN)).toBe(false);
  });
});
