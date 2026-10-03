import {
  fails,
  NOT_APPLICABLE,
  PASS,
  type TSeoRuleGroup,
} from '../../seo-rule.interface';

export const HEADING_RULES: TSeoRuleGroup<
  'H1_MISSING' | 'H1_MULTIPLE' | 'HEADING_SKIP'
> = {
  H1_MISSING: ({ parsed }) => (parsed.h1s.length === 0 ? fails({}) : PASS),

  H1_MULTIPLE: ({ parsed }) =>
    parsed.h1s.length > 1 ? fails({ count: parsed.h1s.length }) : PASS,

  /** The first place the outline jumps more than one level down, e.g. h2 → h4. Fewer than
   *  two headings is no outline to judge, not an outline that happens to be correct. */
  HEADING_SKIP: ({ parsed }) => {
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
  },
};
