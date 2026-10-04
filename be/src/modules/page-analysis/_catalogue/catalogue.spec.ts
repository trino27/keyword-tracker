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

  it('names the right subject on all but one page', () => {
    expect(s.primaryGood).toBeGreaterThanOrEqual(40);
    expect(s.pages).toBe(41);
  });

  it('returns at least 52 labelled-good keywords', () => {
    expect(s.good).toBeGreaterThanOrEqual(52);
  });

  it('returns no more than 37 labelled-junk keywords', () => {
    expect(s.junk).toBeLessThanOrEqual(37);
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
