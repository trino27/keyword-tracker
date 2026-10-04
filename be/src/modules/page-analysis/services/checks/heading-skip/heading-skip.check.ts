import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

/**
 * The first place the outline jumps more than one level down, e.g. h2 to h4. Fewer than
 * two headings is no outline to judge, not an outline that happens to be correct.
 */
export const HEADING_SKIP_CHECK = defineCheck('HEADING_SKIP', ({ parsed }) => {
  if (parsed.headings.length < 2) return NOT_APPLICABLE;
  for (let i = 1; i < parsed.headings.length; i += 1) {
    const previous = parsed.headings[i - 1];
    const current = parsed.headings[i];
    if (current.level > previous.level + 1)
      return fails({
        from: `h${previous.level}`,
        to: `h${current.level}`,
        heading: current.text,
      });
  }
  return PASS;
});
