import {
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  type ISeoIssue,
  type TSeoIssueCode,
} from '@app/contracts';
import { CONTENT_RULES } from './rules/content-rules/content-rules';
import { HEADING_RULES } from './rules/heading-rules/heading-rules';
import { INDEXING_RULES } from './rules/indexing-rules/indexing-rules';
import { KEYWORD_RULES } from './rules/keyword-rules/keyword-rules';
import { META_RULES } from './rules/meta-rules/meta-rules';
import { TITLE_RULES } from './rules/title-rules/title-rules';
import { TRANSPORT_RULES } from './rules/transport-rules/transport-rules';
import type { ISeoRuleInput, TSeoRule } from './seo-rule.interface';

/**
 * One rule per catalogued code. The type is the completeness check: a code added to
 * the catalogue without a rule — or a rule group left out here — does not compile.
 */
export const SEO_RULES: Record<TSeoIssueCode, TSeoRule> = {
  ...TITLE_RULES,
  ...META_RULES,
  ...HEADING_RULES,
  ...INDEXING_RULES,
  ...CONTENT_RULES,
  ...TRANSPORT_RULES,
  ...KEYWORD_RULES,
};

/** Every issue on a page, in catalogue order, with its catalogued severity. */
export function evaluateSeoRules(input: ISeoRuleInput): ISeoIssue[] {
  return SEO_ISSUE_CODES.flatMap((code) => {
    const details = SEO_RULES[code](input);
    return details === null
      ? []
      : [{ code, severity: SEO_ISSUE_CATALOGUE[code].severity, details }];
  });
}
