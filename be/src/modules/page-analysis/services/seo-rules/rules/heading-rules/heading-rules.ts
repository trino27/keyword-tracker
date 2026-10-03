import type { TSeoRuleGroup } from '../../seo-rule.interface';

export const HEADING_RULES: TSeoRuleGroup<
  'H1_MISSING' | 'H1_MULTIPLE' | 'HEADING_SKIP'
> = {
  H1_MISSING: ({ parsed }) => (parsed.h1s.length === 0 ? {} : null),

  H1_MULTIPLE: ({ parsed }) =>
    parsed.h1s.length > 1 ? { count: parsed.h1s.length } : null,

  /** The first place the outline jumps more than one level down, e.g. h2 → h4. */
  HEADING_SKIP: ({ parsed }) => {
    for (let i = 1; i < parsed.headings.length; i += 1) {
      const previous = parsed.headings[i - 1];
      const current = parsed.headings[i];
      if (current.level > previous.level + 1)
        return {
          from: `h${previous.level}`,
          to: `h${current.level}`,
          heading: current.text,
        };
    }
    return null;
  },
};
