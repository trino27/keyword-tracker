import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { evidence } from '../_shared/evidence';
import { defineCheck, fails, PASS } from '../check.interface';

const MIN_WORDS = SEO_ISSUE_CATALOGUE.THIN_CONTENT.min;

export const THIN_CONTENT_CHECK = defineCheck('THIN_CONTENT', ({ parsed }) =>
  parsed.wordCount < MIN_WORDS
    ? fails({
        value: parsed.wordCount,
        min: MIN_WORDS,
        evidence: evidence([
          `${parsed.wordCount} words in the main content — navigation, sidebars, related posts and comments not counted`,
          ...(parsed.firstParagraph
            ? [`It opens: "${parsed.firstParagraph}"`]
            : []),
        ]),
      })
    : PASS,
);
