import { defineCheck, fails, PASS } from '../check.interface';

const REQUIRED_OPEN_GRAPH = ['og:title', 'og:description', 'og:image'] as const;

export const OG_TAGS_MISSING_CHECK = defineCheck(
  'OG_TAGS_MISSING',
  ({ parsed }) => {
    const missing = REQUIRED_OPEN_GRAPH.filter(
      (property) => !(property in parsed.openGraph),
    );
    return missing.length > 0 ? fails({ missing }) : PASS;
  },
);
