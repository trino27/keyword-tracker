import { SEO_ISSUE_CATALOGUE } from '@app/contracts';
import { fails, PASS, type TSeoRuleGroup } from '../../seo-rule.interface';

const MAX_HTML_BYTES = SEO_ISSUE_CATALOGUE.LARGE_PAGE.max;

/** What the response itself says, before any markup is read. All three always apply. */
export const TRANSPORT_RULES: TSeoRuleGroup<
  'NOT_HTTPS' | 'REDIRECTED' | 'LARGE_PAGE'
> = {
  NOT_HTTPS: ({ finalUrl }) =>
    finalUrl.startsWith('http:') ? fails({ url: finalUrl }) : PASS,

  REDIRECTED: ({ url, finalUrl, redirected }) =>
    redirected ? fails({ from: url, to: finalUrl }) : PASS,

  LARGE_PAGE: ({ htmlBytes }) =>
    htmlBytes > MAX_HTML_BYTES
      ? fails({ value: htmlBytes, max: MAX_HTML_BYTES })
      : PASS,
};
