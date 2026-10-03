import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import type { TSeoRuleGroup } from '../../seo-rule.interface';
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
    parsed.metaDescription === null ? {} : null,

  META_DESCRIPTION_LENGTH: ({ parsed }) => {
    if (parsed.metaDescription === null) return null;
    const length = characterLength(parsed.metaDescription);
    return length < min || length > max ? { value: length, min, max } : null;
  },

  CANONICAL_MISSING: ({ parsed }) => (parsed.canonical === null ? {} : null),

  CANONICAL_MISMATCH: ({ parsed, finalUrl }) =>
    parsed.canonical !== null && !sameDocument(parsed.canonical, finalUrl)
      ? { canonical: parsed.canonical, url: finalUrl }
      : null,

  OG_TAGS_MISSING: ({ parsed }) => {
    const missing = REQUIRED_OPEN_GRAPH.filter(
      (property) => !(property in parsed.openGraph),
    );
    return missing.length > 0 ? { missing } : null;
  },

  LANG_MISSING: ({ parsed }) => (parsed.lang === null ? {} : null),
};
