import { attribute, evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

const REQUIRED_OPEN_GRAPH = ['og:title', 'og:description', 'og:image'] as const;

export const OG_TAGS_MISSING_CHECK = defineCheck(
  'OG_TAGS_MISSING',
  ({ parsed }) => {
    const missing = REQUIRED_OPEN_GRAPH.filter(
      (property) => !(property in parsed.openGraph),
    );
    if (missing.length === 0) return PASS;
    const present = Object.entries(parsed.openGraph);
    return fails({
      missing,
      evidence: evidence(
        present.length > 0
          ? present.map(
              ([property, content]) =>
                `<meta property="${property}" content="${attribute(content)}"> — present`,
            )
          : ['No og:* properties in the document'],
      ),
    });
  },
);
