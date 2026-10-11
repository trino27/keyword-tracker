import type { TSeoIssueSeverity } from '../seo-issue-severity.enum.js';
import type { ISeoIssueSource } from '../catalogue/issue-definition.interface.js';
import { INDUSTRY_SOURCE_HOSTS } from '../industry-source-hosts.constant.js';

interface IGradedEntry {
  severity: TSeoIssueSeverity;
  sources: readonly ISeoIssueSource[];
}

const isIndustry = (source: ISeoIssueSource): boolean => {
  const host = new URL(source.url).hostname.replace(/^www\./, '');
  return (INDUSTRY_SOURCE_HOSTS as readonly string[]).includes(host);
};

/**
 * The codes that break plan D1's mechanical half: a severity above notice resting on
 * industry sources alone. The other half — a field audit, and no contradiction with an
 * earlier rejection or an existing check — is held by review, not by this predicate.
 */
export const inclusionBarViolations = (
  catalogue: Readonly<Record<string, IGradedEntry>>,
): string[] =>
  Object.entries(catalogue)
    .filter(
      ([, entry]) =>
        entry.severity !== 'notice' && entry.sources.every(isIndustry),
    )
    .map(([code]) => code);
