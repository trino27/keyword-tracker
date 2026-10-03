import {
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  type TSeoIssue,
  type TSeoIssueCode,
} from '@app/contracts';
import { CONTENT_RULES } from './rules/content-rules/content-rules';
import { HEADING_RULES } from './rules/heading-rules/heading-rules';
import { INDEXING_RULES } from './rules/indexing-rules/indexing-rules';
import { META_RULES } from './rules/meta-rules/meta-rules';
import { STRUCTURED_DATA_RULES } from './rules/structured-data-rules/structured-data-rules';
import { TITLE_RULES } from './rules/title-rules/title-rules';
import { TRANSPORT_RULES } from './rules/transport-rules/transport-rules';
import type { ISeoRuleInput, TSeoRule } from './seo-rule.interface';

/**
 * One rule per catalogued code. The type is the completeness check: a code added to
 * the catalogue without a rule — or a rule group left out here — does not compile.
 */
export const SEO_RULES: { [K in TSeoIssueCode]: TSeoRule<K> } = {
  ...TITLE_RULES,
  ...META_RULES,
  ...HEADING_RULES,
  ...INDEXING_RULES,
  ...CONTENT_RULES,
  ...TRANSPORT_RULES,
  ...STRUCTURED_DATA_RULES,
};

/** What one pass over the rules concluded about a page. */
export interface ISeoEvaluation {
  /** In catalogue order, as the screens read them. */
  issues: TSeoIssue[];
  /** Outcomes that were not `notApplicable` — the score's denominator. */
  checksApplicable: number;
  /** Outcomes that were `fails`. Always `issues.length`; see below. */
  checksFailed: number;
}

/**
 * Every issue on a page, in catalogue order with its catalogued severity, and the two
 * counts its score is derived from.
 *
 * All three come from ONE pass. Counting applicability separately is how the counts and
 * the issue list come to disagree, and the disagreement would be invisible: a score of 88
 * beside nine findings looks no stranger than a score of 88 beside two.
 *
 * `checksFailed` is always `issues.length`, and storing it anyway is deliberate — the
 * column is what the score reads, and a column derived from a count the reader cannot see
 * is worse than a redundant one the database can check.
 */
export function evaluateSeoRules(input: ISeoRuleInput): ISeoEvaluation {
  const issues: TSeoIssue[] = [];
  let checksApplicable = 0;

  for (const code of SEO_ISSUE_CODES) {
    const verdict = SEO_RULES[code](input);
    if (verdict.outcome === 'notApplicable') continue;
    checksApplicable += 1;
    if (verdict.outcome === 'fails')
      issues.push({
        code,
        severity: SEO_ISSUE_CATALOGUE[code].severity,
        details: verdict.details,
      } as TSeoIssue);
  }

  return { issues, checksApplicable, checksFailed: issues.length };
}
