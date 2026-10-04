import { runArm } from './harness';
import { score, summary } from './score';

/**
 * What keyword extraction returns for the whole recorded catalogue, against keywords
 * labelled by hand (`labels.ts`).
 *
 * The per-step specs pin mechanisms; this pins the OUTCOME, which no single mechanism
 * owns. Every tuning decision in `keyword-scoring.constant.ts` was taken by moving one
 * value and reading this, and a change that improves one page by spoiling two shows up
 * here and nowhere else.
 *
 * The counts below are a ratchet, not a target. Raise them when a change earns it;
 * never lower one to make a commit pass without saying in the message what was traded
 * and why.
 */
describe('keyword catalogue', () => {
  let s: ReturnType<typeof score>;
  beforeAll(async () => {
    s = score(await runArm({}));
  });

  /**
   * 39, not 41. Damping the title windows a page never repeats releases the fragment
   * each window was suppressing, and on two pages that fragment outranks the clause
   * it is a piece of: "Artificial intelligence statistics" returns `artificial
   * intelligence` and "Traffic from Facebook is decreasing" returns `traffic from
   * facebook`. Neither is wrong — both are the page's own title, cut short, and
   * neither is labelled — but neither is the term that was labelled good, so this
   * counts them as losses. Subsuming on the undamped score takes both back and costs
   * 3 junk keywords doing it; see UNCORROBORATED_TITLE_FACTOR for that measurement.
   */
  it('names the right subject on every page', () => {
    expect(s.primaryGood).toBeGreaterThanOrEqual(39);
    expect(s.pages).toBe(41);
  });

  /** 50, not 54: the same two truncations, plus `bolded text` and `global market
   * size for ai`, which the pages state once in a heading and never again. */
  it('returns at least 50 labelled-good keywords', () => {
    expect(s.good).toBeGreaterThanOrEqual(50);
  });

  /** 27, down from 35: what the two rules above were written for. */
  it('returns no more than 27 labelled-junk keywords', () => {
    expect(s.junk).toBeLessThanOrEqual(27);
  });

  it('leaves no page without a keyword', () => {
    expect(s.emptyPages).toBe(0);
  });

  it('reports the catalogue so a change can be read, not only counted', () => {
    console.log(`\n${summary('catalogue', s)}\n${s.lines.join('\n')}`);
    // An unlabelled term is one no one has judged; it counts towards nothing above.
    expect(s.unlabelled).toBeLessThanOrEqual(6);
  });
});
