import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import type { TSeoRuleGroup } from '../../seo-rule.interface';

const MAX_HTML_BYTES = SEO_ISSUE_CATALOGUE.LARGE_PAGE.max;

/** What the response itself says, before any markup is read. */
export const TRANSPORT_RULES: TSeoRuleGroup<
  'NOT_HTTPS' | 'REDIRECTED' | 'LARGE_PAGE'
> = {
  NOT_HTTPS: ({ finalUrl }) =>
    finalUrl.startsWith('http:') ? { url: finalUrl } : null,

  REDIRECTED: ({ url, finalUrl, redirected }) =>
    redirected ? { from: url, to: finalUrl } : null,

  LARGE_PAGE: ({ htmlBytes }) =>
    htmlBytes > MAX_HTML_BYTES
      ? { value: htmlBytes, max: MAX_HTML_BYTES }
      : null,
};
