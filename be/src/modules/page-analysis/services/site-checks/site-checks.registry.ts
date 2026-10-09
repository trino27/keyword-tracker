import {
  SITE_CHECK_CATALOGUE,
  SITE_CHECK_CODES,
  type ISiteCheckResult,
} from '@app/contracts';
import {
  hostRedirectChain,
  hostVariantServesContent,
  soft404,
} from './host-checks';
import {
  robotsGooglebotGroupDropsRules,
  robotsTxtTruncated,
  robotsTxtUnsupportedRules,
} from './robots-checks';
import type {
  ISiteCheckInput,
  TSiteCheckRegistry,
} from './site-check.interface';
import {
  sitemapLastmodUnreliable,
  sitemapListsNonIndexable,
  sitemapListsOtherHostVariants,
} from './sitemap-checks';

/** One check per site code, typed so a code without a check does not compile. */
export const SITE_CHECKS: TSiteCheckRegistry = {
  ROBOTS_TXT_TRUNCATED: robotsTxtTruncated,
  ROBOTS_TXT_UNSUPPORTED_RULES: robotsTxtUnsupportedRules,
  ROBOTS_GOOGLEBOT_GROUP_DROPS_RULES: robotsGooglebotGroupDropsRules,
  SITEMAP_LISTS_NON_INDEXABLE: sitemapListsNonIndexable,
  SITEMAP_LISTS_OTHER_HOST_VARIANTS: sitemapListsOtherHostVariants,
  SITEMAP_LASTMOD_UNRELIABLE: sitemapLastmodUnreliable,
  HOST_VARIANT_SERVES_CONTENT: hostVariantServesContent,
  HOST_REDIRECT_CHAIN: hostRedirectChain,
  SOFT_404: soft404,
};

/**
 * Every site check's verdict for one crawl, in catalogue order, with the catalogue's
 * severity. All of them, not only the failures: the run log shows what was checked and
 * passed, and what could not be judged, so silence never reads as a pass.
 */
export function evaluateSite(
  input: ISiteCheckInput,
  checks: TSiteCheckRegistry = SITE_CHECKS,
): ISiteCheckResult[] {
  return SITE_CHECK_CODES.map((code) => {
    const verdict = checks[code](input);
    const severity = SITE_CHECK_CATALOGUE[code].severity;
    if (verdict.outcome === 'fails')
      return { code, status: 'failed', severity, details: verdict.details };
    return {
      code,
      status: verdict.outcome === 'pass' ? 'passed' : 'notApplicable',
      severity,
      details: {},
    };
  });
}
