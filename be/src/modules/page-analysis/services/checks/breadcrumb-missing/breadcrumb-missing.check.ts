import { defineCheck, fails, NOT_APPLICABLE, PASS } from '../check.interface';

const BREADCRUMB_LIST = 'BreadcrumbList';

/**
 * A page that declares no BreadcrumbList in JSON-LD (an `@graph` included) or Microdata.
 * Any trail counts as declared, the lone "Home" step too: whether a trail is complete is
 * BREADCRUMB_INVALID's question. RDFa is not read (plan O7). A trail an inline script
 * will insert — Next.js carries it in its payload — is read by Google once it renders,
 * and this crawler cannot confirm it, so the check is not applicable rather than wrong.
 */
export const BREADCRUMB_MISSING_CHECK = defineCheck(
  'BREADCRUMB_MISSING',
  ({ parsed }) => {
    if (
      parsed.breadcrumbs.length > 0 ||
      parsed.jsonLd.types.includes(BREADCRUMB_LIST) ||
      parsed.microdata.types.includes(BREADCRUMB_LIST)
    )
      return PASS;
    if (parsed.scriptedSchemaTypes.includes(BREADCRUMB_LIST))
      return NOT_APPLICABLE;
    return fails({
      evidence: [
        'No BreadcrumbList in the JSON-LD or the Microdata of the page.',
      ],
    });
  },
);
