import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import {
  fails,
  NOT_APPLICABLE,
  PASS,
  type TSeoRuleGroup,
} from '../../seo-rule.interface';
import { characterLength } from '../title-rules/title-rules';

const { min, max } = SEO_ISSUE_CATALOGUE.META_DESCRIPTION_LENGTH;

const REQUIRED_OPEN_GRAPH = ['og:title', 'og:description', 'og:image'] as const;

/** Same document: scheme and host as given, trailing slash and fragment ignored. */
function sameDocument(a: string, b: string): boolean {
  const key = (url: string) => {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.href.replace(/\/+$/, '');
  };
  try {
    return key(a) === key(b);
  } catch {
    return false;
  }
}

export const META_RULES: TSeoRuleGroup<
  | 'META_DESCRIPTION_MISSING'
  | 'META_DESCRIPTION_LENGTH'
  | 'CANONICAL_MISSING'
  | 'CANONICAL_MISMATCH'
  | 'OG_TAGS_MISSING'
  | 'LANG_MISSING'
> = {
  META_DESCRIPTION_MISSING: ({ parsed }) =>
    parsed.metaDescription === null ? fails({}) : PASS,

  /** Nothing to measure without a description; META_DESCRIPTION_MISSING says the rest. */
  META_DESCRIPTION_LENGTH: ({ parsed }) => {
    if (parsed.metaDescription === null) return NOT_APPLICABLE;
    const length = characterLength(parsed.metaDescription);
    return length < min || length > max
      ? fails({ value: length, min, max })
      : PASS;
  },

  CANONICAL_MISSING: ({ parsed }) =>
    parsed.canonical === null ? fails({}) : PASS,

  /** Without a canonical there is no claim to disagree with, only CANONICAL_MISSING. */
  CANONICAL_MISMATCH: ({ parsed, finalUrl }) => {
    if (parsed.canonical === null) return NOT_APPLICABLE;
    return sameDocument(parsed.canonical, finalUrl)
      ? PASS
      : fails({ canonical: parsed.canonical, url: finalUrl });
  },

  OG_TAGS_MISSING: ({ parsed }) => {
    const missing = REQUIRED_OPEN_GRAPH.filter(
      (property) => !(property in parsed.openGraph),
    );
    return missing.length > 0 ? fails({ missing }) : PASS;
  },

  LANG_MISSING: ({ parsed }) => (parsed.lang === null ? fails({}) : PASS),
};
