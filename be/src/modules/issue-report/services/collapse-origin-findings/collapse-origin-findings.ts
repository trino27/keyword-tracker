import {
  CWV_CODES,
  type TCwvSeoIssue,
  type TReportIssue,
  type TSeoIssue,
} from '@app/contracts';
import type { IPageFinding } from '../../interfaces/page-finding.interface';

export type { IPageFinding };

const CWV = new Set<string>(CWV_CODES);

/**
 * A Core Web Vitals finding: the only kind whose value may be the site's. Image delivery
 * is a speed finding too, but a lab estimate about one page, and stays at it (plan D47).
 */
const isCwv = (issue: TSeoIssue): issue is TCwvSeoIssue => CWV.has(issue.code);

/**
 * Page findings as report rows, with every Core Web Vitals finding whose value is the WHOLE SITE's
 * folded into one row per code (plan D8): "INP needs improvement — whole site (15 pages)"
 * once, rather than the same sentence on fifteen pages. The row keeps the details of the
 * most recently measured page in the group. URL- and lab-sourced findings stay per page,
 * so one code can appear both ways — some pages have figures of their own.
 */
export function collapseOriginFindings(
  findings: readonly IPageFinding[],
): TReportIssue[] {
  const rows: TReportIssue[] = [];
  const origin = new Map<string, IPageFinding[]>();

  for (const finding of findings) {
    const { issue } = finding;
    if (isCwv(issue) && issue.details.source === 'origin') {
      const group = origin.get(issue.code) ?? [];
      group.push(finding);
      origin.set(issue.code, group);
    } else {
      rows.push({ ...issue, location: { kind: 'page', page: finding.page } });
    }
  }

  for (const group of origin.values()) {
    const latest = [...group].sort(
      (a, b) =>
        (b.measuredAt?.getTime() ?? 0) - (a.measuredAt?.getTime() ?? 0) ||
        b.page.id - a.page.id,
    )[0];
    rows.push({
      ...(latest.issue as TCwvSeoIssue),
      location: { kind: 'allPages', pageCount: group.length },
    });
  }
  return rows;
}
