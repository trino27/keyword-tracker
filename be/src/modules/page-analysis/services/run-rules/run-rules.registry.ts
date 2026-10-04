import {
  RUN_ISSUE_CODES,
  SEO_ISSUE_CATALOGUE,
  SEO_ISSUE_CODES,
  type TRunIssueCode,
  type TSeoIssue,
  type TSeoIssueCode,
} from '@app/contracts';
import type { ISeoEvaluation } from '../seo-rules/seo-rules.registry';
import { DUPLICATION_RULES } from './rules/duplication-rules/duplication-rules';
import type { IRunRuleInput, TRunRule } from './run-rule.interface';

/**
 * One rule per run-scoped code. Typed the same way `SEO_RULES` is, for the same
 * reason: a run code added to the catalogue without a rule does not compile.
 */
export const RUN_RULES: { [K in TRunIssueCode]: TRunRule<K> } = {
  ...DUPLICATION_RULES,
};

const orderOf = (code: TSeoIssueCode) => SEO_ISSUE_CODES.indexOf(code);

/**
 * Runs the run-scoped checks and folds their verdicts into the evaluations the page
 * rules already produced.
 *
 * Folding rather than returning a second verdict is the whole design. A page's score
 * is one number over one denominator, and a run finding is a finding about that page
 * — so it joins the same `issues` list, the same `checksJudged`, the same counts. A
 * separate run-level report would have meant a second score per page and a reader
 * having to add them up.
 *
 * Both lists are rebuilt in catalogue order rather than appended to: the screens read
 * issues in that order, and a run code sitting among the page codes in the catalogue
 * would otherwise always sort last.
 */
export function applyRunRules(
  input: IRunRuleInput,
  evaluations: readonly ISeoEvaluation[],
): ISeoEvaluation[] {
  const verdicts = RUN_ISSUE_CODES.map(
    (code) => [code, RUN_RULES[code](input)] as const,
  );

  return evaluations.map((evaluation, index) => {
    const issues: TSeoIssue[] = [...evaluation.issues];
    const judged: TSeoIssueCode[] = [...evaluation.checksJudged];
    const notApplicable: TSeoIssueCode[] = [...evaluation.checksNotApplicable];

    for (const [code, perPage] of verdicts) {
      const verdict = perPage[index];
      if (!verdict) continue;
      if (verdict.outcome === 'notApplicable') {
        notApplicable.push(code);
        continue;
      }
      judged.push(code);
      if (verdict.outcome === 'fails')
        issues.push({
          code,
          severity: SEO_ISSUE_CATALOGUE[code].severity,
          details: verdict.details,
        });
    }

    issues.sort((a, b) => orderOf(a.code) - orderOf(b.code));
    judged.sort((a, b) => orderOf(a) - orderOf(b));
    notApplicable.sort((a, b) => orderOf(a) - orderOf(b));

    return {
      issues,
      checksJudged: judged,
      checksNotApplicable: notApplicable,
      checksApplicable: judged.length,
      checksFailed: issues.length,
    };
  });
}
