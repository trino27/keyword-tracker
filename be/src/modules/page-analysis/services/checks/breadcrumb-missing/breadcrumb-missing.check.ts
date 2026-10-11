import { defineCheck, fails, PASS } from '../check.interface';

const BREADCRUMB_LIST = 'BreadcrumbList';

/**
 * A page that declares no BreadcrumbList in JSON-LD (an `@graph` included) or Microdata.
 * Any trail counts as declared, the lone "Home" step too: whether a trail is complete is
 * BREADCRUMB_INVALID's question. RDFa is not read (plan O7).
 */
export const BREADCRUMB_MISSING_CHECK = defineCheck(
  'BREADCRUMB_MISSING',
  ({ parsed }) =>
    parsed.breadcrumbs.length > 0 ||
    parsed.jsonLd.types.includes(BREADCRUMB_LIST) ||
    parsed.microdata.types.includes(BREADCRUMB_LIST)
      ? PASS
      : fails({
          evidence: [
            'No BreadcrumbList in the JSON-LD or the Microdata of the page.',
          ],
        }),
);
